import os
import logging
import uuid
import chromadb
from chromadb import EmbeddingFunction, Documents, Embeddings
from app.config import settings

logger = logging.getLogger("app.services.vector_store")

class GeminiEmbeddingFunction(EmbeddingFunction):
    def __init__(self, api_key: str):
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        self.embedder = GoogleGenerativeAIEmbeddings(
            model="gemini-embedding-2",
            google_api_key=api_key
        )

    def __call__(self, input: Documents) -> Embeddings:
        try:
            return self.embedder.embed_documents(list(input))
        except Exception as e:
            logger.error(f"Error generating Gemini embeddings: {e}")
            raise e

class VectorStoreService:
    def __init__(self):
        # Initialize Persistent ChromaDB client
        self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

    def _get_embedding_function(self):
        """
        Returns a lightweight API-based embedding function (Google Gemini)
        to avoid loading heavy ONNX / PyTorch models into server RAM on Render.
        """
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if api_key:
            try:
                return GeminiEmbeddingFunction(api_key=api_key)
            except Exception as e:
                logger.warning(f"Could not initialize GeminiEmbeddingFunction: {e}")
        return None

    def _get_collection_name(self, project_id: uuid.UUID) -> str:
        """Helper to get a valid ChromaDB collection name from project ID."""
        # Must be between 3 and 63 characters and alphanumeric/dashes/underscores
        return f"project_{str(project_id).replace('-', '_')}"

    def chunk_text(self, text: str, chunk_size: int = 2000, chunk_overlap: int = 300) -> list[tuple[str, int]]:
        """
        Chunks text into overlapping blocks while preserving line integrity.
        Returns a list of tuples containing (chunk_content, start_line_number).
        """
        lines = text.splitlines()
        chunks = []
        
        current_chunk = []
        current_length = 0
        start_line = 1
        
        for idx, line in enumerate(lines):
            line_len = len(line) + 1  # Account for newline character
            
            # If adding this line exceeds the chunk size, push the current chunk
            if current_length + line_len > chunk_size and current_chunk:
                chunk_content = "\n".join(current_chunk)
                chunks.append((chunk_content, start_line))
                
                # Determine lines to overlap
                overlap_lines = []
                overlap_len = 0
                for old_line in reversed(current_chunk):
                    if overlap_len + len(old_line) + 1 > chunk_overlap:
                        break
                    overlap_lines.insert(0, old_line)
                    overlap_len += len(old_line) + 1
                
                current_chunk = overlap_lines
                current_length = overlap_len
                start_line = idx + 1 - len(current_chunk)
            
            current_chunk.append(line)
            current_length += line_len
            
        # Add remaining text
        if current_chunk:
            chunk_content = "\n".join(current_chunk)
            chunks.append((chunk_content, start_line))
            
        return chunks

    async def index_files(self, project_id: uuid.UUID, parsed_files: list[dict]) -> None:
        """
        Chunks and indexes parsed codebase files in a dedicated project collection.
        """
        collection_name = self._get_collection_name(project_id)
        logger.info(f"Indexing {len(parsed_files)} files in collection {collection_name}")
        
        # Get or create the collection with lightweight embedding function
        emb_fn = self._get_embedding_function()
        if emb_fn:
            collection = self.client.get_or_create_collection(name=collection_name, embedding_function=emb_fn)
        else:
            collection = self.client.get_or_create_collection(name=collection_name)
        
        documents = []
        metadatas = []
        ids = []
        
        for file_info in parsed_files:
            file_path = file_info["file_path"]
            content = file_info["content"]
            
            # Splitting text into manageable chunks
            chunks = self.chunk_text(content)
            
            for chunk_idx, (chunk_text, start_line) in enumerate(chunks):
                documents.append(chunk_text)
                metadatas.append({
                    "project_id": str(project_id),
                    "file_path": file_path,
                    "start_line": start_line
                })
                ids.append(f"{file_path}_chunk_{chunk_idx}")

        # Add in smaller batches to avoid memory spikes on low-RAM containers
        batch_size = 50
        for i in range(0, len(documents), batch_size):
            try:
                collection.add(
                    documents=documents[i:i+batch_size],
                    metadatas=metadatas[i:i+batch_size],
                    ids=ids[i:i+batch_size]
                )
            except Exception as e:
                logger.error(f"Error adding batch to collection {collection_name}: {e}")
            
        logger.info(f"Indexing completed for collection {collection_name}. Total chunks: {len(documents)}")

    async def query_code(self, project_id: uuid.UUID, query: str, n_results: int = 8) -> list[dict]:
        """
        Performs semantic similarity search inside the project's codebase.
        """
        collection_name = self._get_collection_name(project_id)
        emb_fn = self._get_embedding_function()
        try:
            if emb_fn:
                collection = self.client.get_collection(name=collection_name, embedding_function=emb_fn)
            else:
                collection = self.client.get_collection(name=collection_name)
        except Exception:
            logger.warning(f"Collection {collection_name} not found.")
            return []

        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        formatted_results = []
        if results and "documents" in results and results["documents"]:
            # Chroma returns lists nested inside lists [ [doc1, doc2] ]
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
            
            for doc, meta, dist in zip(docs, metas, distances):
                formatted_results.append({
                    "content": doc,
                    "file_path": meta.get("file_path"),
                    "start_line": meta.get("start_line"),
                    "score": 1.0 - dist  # basic similarity score conversion
                })
                
        return formatted_results

    async def delete_project_index(self, project_id: uuid.UUID) -> None:
        """
        Deletes the ChromaDB collection associated with the project.
        """
        collection_name = self._get_collection_name(project_id)
        try:
            self.client.delete_collection(name=collection_name)
            logger.info(f"Successfully deleted collection {collection_name}")
        except Exception as e:
            logger.error(f"Failed to delete collection {collection_name}: {str(e)}")

# Single instance vector store service
vector_store = VectorStoreService()

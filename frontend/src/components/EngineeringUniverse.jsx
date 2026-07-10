import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Info, 
  Building2, 
  Database, 
  Code, 
  Cloud, 
  ShieldCheck, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Users
} from 'lucide-react';
import { getEngineeringUniverse, clearEngineeringUniverse } from '../api';

export default function EngineeringUniverse({ project }) {
  const [universeData, setUniverseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const loadUniverse = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use project name or fallback to seed static org_id
      const orgId = "org-enterprise-01";
      const data = await getEngineeringUniverse(orgId);
      setUniverseData(data);
      if (data.nodes && data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load architecture mapping.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUniverse();
  }, [project?.id]);

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear this architecture mapping? It will recompile on next load.")) return;
    try {
      const orgId = "org-enterprise-01";
      await clearEngineeringUniverse(orgId);
      setUniverseData(null);
      setSelectedNode(null);
    } catch (err) {
      alert("Failed to clear architecture map: " + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-color)', marginBottom: '16px' }} />
        <p style={{ fontSize: '15px' }}>Compiling corporate architecture map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ borderLeft: '4px solid var(--danger-color)', padding: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--danger-color)', marginBottom: '16px' }}>
          <AlertCircle size={24} />
          <h3 style={{ margin: 0 }}>Failed to Compile Architecture Map</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
        <button onClick={loadUniverse} className="btn-primary">Retry Compilation</button>
      </div>
    );
  }

  if (!universeData) return null;

  // Filter nodes & edges
  const filteredNodes = universeData.nodes.filter(n => typeFilter === "all" || n.type === typeFilter);
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = universeData.edges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));

  const getNodeColor = (type) => {
    switch (type) {
      case "organization":
        return "#3b82f6"; // blue
      case "team":
        return "#10b981"; // emerald
      case "repository":
        return "#f59e0b"; // amber
      case "microservice":
        return "#8b5cf6"; // violet
      case "database":
        return "#ec4899"; // pink
      case "cloud":
        return "#14b8a6"; // teal
      case "policy":
        return "#ef4444"; // red
      default:
        return "#94a3b8"; // slate
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case "organization":
        return <Building2 size={16} />;
      case "team":
        return <Users size={16} />;
      case "repository":
        return <Code size={16} />;
      case "database":
        return <Database size={16} />;
      case "cloud":
        return <Cloud size={16} />;
      case "policy":
        return <ShieldCheck size={16} />;
      default:
        return <Network size={16} />;
    }
  };

  // Simple static circular graph layout coordinates for visual representation
  const width = 600;
  const height = 400;
  const nodeCount = filteredNodes.length;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 140;

  const nodePositions = {};
  filteredNodes.forEach((node, idx) => {
    if (node.type === "organization") {
      nodePositions[node.id] = { x: centerX, y: centerY };
    } else {
      const angle = (idx / (nodeCount - 1)) * 2 * Math.PI;
      nodePositions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    }
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }}>
      
      {/* Graph Visualizer Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#fff' }}>Architecture Map</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{universeData.summary}</span>
            </div>
            <button onClick={handleClear} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <Trash2 size={12} /> Recompile
            </button>
          </div>

          {/* Node Category Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            {[
              { id: "all", label: "All Assets" },
              { id: "team", label: "Teams" },
              { id: "repository", label: "Repositories" },
              { id: "microservice", label: "Microservices" },
              { id: "database", label: "Databases" },
              { id: "cloud", label: "Cloud Infra" },
              { id: "policy", label: "Policies" }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setTypeFilter(filter.id)}
                style={{
                  padding: '6px 12px',
                  background: typeFilter === filter.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  color: typeFilter === filter.id ? '#fff' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Interactive SVG Diagram */}
          <div style={{ background: '#090812', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', height: `${height}px`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {nodeCount === 0 ? (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No nodes match active filter.</span>
            ) : (
              <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ userSelect: 'none' }}>
                {/* Draw Edges */}
                {filteredEdges.map((edge, idx) => {
                  const srcPos = nodePositions[edge.source];
                  const tgtPos = nodePositions[edge.target];
                  if (!srcPos || !tgtPos) return null;
                  return (
                    <line
                      key={edge.id}
                      x1={srcPos.x}
                      y1={srcPos.y}
                      x2={tgtPos.x}
                      y2={tgtPos.y}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth={1.5}
                    />
                  );
                })}

                {/* Draw Nodes */}
                {filteredNodes.map(node => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;
                  const isSelected = selectedNode?.id === node.id;
                  const color = getNodeColor(node.type);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => setSelectedNode(node)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        r={node.type === 'organization' ? 24 : 14}
                        fill={color}
                        stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.1)'}
                        strokeWidth={isSelected ? 3 : 1}
                        style={{ transition: 'all 0.2s' }}
                      />
                      <text
                        y={node.type === 'organization' ? 38 : 28}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={node.type === 'organization' ? '11px' : '9px'}
                        fontWeight="600"
                        style={{ pointerEvents: 'none' }}
                      >
                        {node.label.length > 18 ? node.label.substring(0, 15) + "..." : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Node Inspector Panel */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="glass-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Info size={18} style={{ color: 'var(--accent-color)' }} />
            <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Asset Details</h4>
          </div>

          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: `${getNodeColor(selectedNode.type)}20`,
                  color: getNodeColor(selectedNode.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getNodeIcon(selectedNode.type)}
                </div>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#fff' }}>{selectedNode.label}</h5>
                  <span style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: getNodeColor(selectedNode.type),
                    fontWeight: '700'
                  }}>{selectedNode.type}</span>
                </div>
              </div>

              {/* Node Metadata Detail List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Configuration Matrix</span>
                {Object.entries(selectedNode.metadata).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                    <span style={{ fontSize: '12px', color: '#fff', wordBreak: 'break-all' }}>{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Select an asset node in the graph to inspect properties.</span>
          )}
        </div>
      </div>

    </div>
  );
}

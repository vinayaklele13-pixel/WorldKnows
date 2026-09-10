'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Network } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  type: string;
  description?: string | null;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface KnowledgeGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
}

const TYPE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  PERSON: { fill: '#312e81', stroke: '#6366f1', text: '#818cf8' },
  ORGANIZATION: { fill: '#1e1b4b', stroke: '#4f46e5', text: '#a5b4fc' },
  PLACE: { fill: '#064e3b', stroke: '#059669', text: '#34d399' },
  TECHNOLOGY: { fill: '#78350f', stroke: '#d97706', text: '#fbbf24' },
  CONCEPT: { fill: '#581c87', stroke: '#9333ea', text: '#c084fc' },
  EVENT: { fill: '#831843', stroke: '#db2777', text: '#f472b6' },
  OTHER: { fill: '#27272a', stroke: '#52525b', text: '#a1a1aa' },
};

export default function KnowledgeGraph({ nodes, edges, onNodeClick }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  // Position cache
  const nodePositionsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());

  // Initialize or update node physics positions
  useEffect(() => {
    const posMap = nodePositionsRef.current;
    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.65;

    nodes.forEach((node, i) => {
      if (!posMap.has(node.id)) {
        const angle = (i / Math.max(1, nodes.length)) * 2 * Math.PI;
        posMap.set(node.id, {
          x: centerX + radius * Math.cos(angle) + (Math.random() * 20 - 10),
          y: centerY + radius * Math.sin(angle) + (Math.random() * 20 - 10),
          vx: 0,
          vy: 0,
        });
      }
    });
  }, [nodes]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      const posMap = nodePositionsRef.current;

      // Draw edges
      edges.forEach((edge) => {
        const sourcePos = posMap.get(edge.source);
        const targetPos = posMap.get(edge.target);
        if (sourcePos && targetPos) {
          ctx.beginPath();
          ctx.moveTo(sourcePos.x, sourcePos.y);
          ctx.lineTo(targetPos.x, targetPos.y);
          ctx.strokeStyle = '#27272A';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Edge label type badge midpoint
          const midX = (sourcePos.x + targetPos.x) / 2;
          const midY = (sourcePos.y + targetPos.y) / 2;
          ctx.fillStyle = '#71717A';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(edge.type.replace(/_/g, ' '), midX, midY - 4);
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pos = posMap.get(node.id);
        if (!pos) return;

        const colors = TYPE_COLORS[node.type] || TYPE_COLORS.OTHER;
        const isHovered = hoveredNode?.id === node.id;

        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, isHovered ? 22 : 18, 0, 2 * Math.PI);
        ctx.fillStyle = colors.fill;
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#FAFAFA' : colors.stroke;
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.stroke();

        // Node label
        ctx.fillStyle = '#FAFAFA';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, pos.x, pos.y + 30);

        // Type badge
        ctx.fillStyle = colors.text;
        ctx.font = '8px monospace';
        ctx.fillText(node.type, pos.x, pos.y - 24);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, edges, scale, offset, hoveredNode]);

  // Mouse interactivity for pan & click
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - offset.x) / scale;
    const mouseY = (e.clientY - rect.top - offset.y) / scale;

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Check node hover
    const posMap = nodePositionsRef.current;
    let found: Node | null = null;
    nodes.forEach((node) => {
      const pos = posMap.get(node.id);
      if (pos) {
        const dist = Math.hypot(pos.x - mouseX, pos.y - mouseY);
        if (dist < 20) {
          found = node;
        }
      }
    });

    setHoveredNode(found);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode && onNodeClick) {
      onNodeClick(hoveredNode.id);
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.25, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  if (nodes.length === 0) {
    return (
      <div className="w-full h-[450px] rounded-2xl border border-[#27272A]/60 bg-[#111113]/30 flex flex-col items-center justify-center p-8 text-center">
        <Network className="w-8 h-8 text-[#71717A] mb-2 animate-pulse" />
        <span className="text-sm text-[#A1A1AA]">No graph nodes available to visualize.</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-[500px] rounded-2xl border border-[#27272A]/60 bg-[#111113]/40 overflow-hidden shadow-2xl shadow-black/50">
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-[#18181B]/90 backdrop-blur-md border border-[#27272A] rounded-xl p-1.5 shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 hover:bg-[#27272A] rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 hover:bg-[#27272A] rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-[#27272A] mx-0.5"></div>
        <button
          onClick={handleReset}
          title="Reset View"
          className="p-2 hover:bg-[#27272A] rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Legend & Hover Info */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#18181B]/90 backdrop-blur-md border border-[#27272A] rounded-xl p-3 shadow-lg max-w-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-indigo-400">
          <Network className="w-3 h-3" />
          Knowledge Graph Navigator
        </div>
        {hoveredNode ? (
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-[#FAFAFA]">{hoveredNode.name}</div>
            <div className="text-[10px] font-mono text-[#71717A] uppercase">{hoveredNode.type}</div>
            {hoveredNode.description && (
              <div className="text-[11px] text-[#A1A1AA] line-clamp-2 mt-1">{hoveredNode.description}</div>
            )}
            <div className="text-[9px] text-indigo-400 mt-1 font-mono">Click node to inspect entity</div>
          </div>
        ) : (
          <div className="text-[11px] text-[#71717A]">
            Drag to pan, scroll to zoom, click node for details.
          </div>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}

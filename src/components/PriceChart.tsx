import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

export interface ChartPoint {
  time: number;
  price: number;
  volume?: number;
}

interface PriceChartProps {
  data: ChartPoint[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  backgroundColor?: string;
}

export function PriceChart({
  data,
  width = 0,
  height = 200,
  strokeColor = '#6366f1',
  fillColor = 'rgba(99, 102, 241, 0.2)',
  backgroundColor = 'transparent',
}: PriceChartProps) {
  const { path, areaPath, viewWidth, viewHeight } = useMemo(() => {
    const safeData = Array.isArray(data) ? data.filter((d) => Number.isFinite(d.price)) : [];
    const n = safeData.length;
    const viewWidthComputed = Math.max(width, 320);
    const viewHeightComputed = height;

    if (n === 0) {
      return { path: '', areaPath: '', viewWidth: viewWidthComputed, viewHeight: viewHeightComputed };
    }

    const prices = safeData.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const paddingX = 8;
    const paddingY = 10;
    const innerW = viewWidthComputed - paddingX * 2;
    const innerH = viewHeightComputed - paddingY * 2;

    const xForIndex = (i: number) => paddingX + (i / Math.max(1, n - 1)) * innerW;
    const yForPrice = (p: number) => paddingY + (1 - (p - minPrice) / priceRange) * innerH;

    const commands: string[] = [];
    safeData.forEach((d, i) => {
      const x = xForIndex(i);
      const y = yForPrice(d.price);
      commands.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    });
    const linePath = commands.join(' ');

    // Area fill from line down to baseline
    const firstX = xForIndex(0);
    const lastX = xForIndex(n - 1);
    const baseY = yForPrice(minPrice);
    const area = `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;

    return { path: linePath, areaPath: area, viewWidth: viewWidthComputed, viewHeight: viewHeightComputed };
  }, [data, width, height]);

  return (
    <View style={{ width: '100%', height: viewHeight, overflow: 'hidden', borderRadius: 12 }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${viewWidth} ${viewHeight}`}> 
        <Rect x={0} y={0} width={viewWidth} height={viewHeight} fill={backgroundColor} />
        {areaPath ? <Path d={areaPath} fill={fillColor} /> : null}
        {path ? <Path d={path} fill="none" stroke={strokeColor} strokeWidth={2} /> : null}
      </Svg>
    </View>
  );
}

export default PriceChart;



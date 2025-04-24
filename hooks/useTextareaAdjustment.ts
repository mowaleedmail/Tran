import { useState, useCallback } from 'react';

interface UseTextareaAdjustmentProps {
  sourceLength: number;
  targetLength: number;
  minHeight: number;
  fontSizeThreshold: number;
}

interface UseTextareaAdjustmentReturn {
  sourceHeight: number;
  targetHeight: number;
  syncedHeight: number;
  sourceFontSize: string;
  targetFontSize: string;
  updateSourceLength: (length: number) => void;
  updateTargetLength: (length: number) => void;
}

export function useTextareaAdjustment({
  sourceLength: initialSourceLength = 0,
  targetLength: initialTargetLength = 0,
  minHeight = 450,
  fontSizeThreshold = 450,
}: Partial<UseTextareaAdjustmentProps> = {}): UseTextareaAdjustmentReturn {
  const [sourceLength, setSourceLength] = useState<number>(initialSourceLength);
  const [targetLength, setTargetLength] = useState<number>(initialTargetLength);
  
  // Calculate base heights based on character count
  // This is a simple formula that can be adjusted based on actual requirements
  const calculateBaseHeight = useCallback((charCount: number): number => {
    // Each character contributes to the height
    // This is a simplified calculation - adjust as needed
    const baseHeight = Math.max(minHeight, Math.ceil(charCount / 100) * 50);
    return baseHeight;
  }, [minHeight]);

  // Calculate heights based on character counts
  const sourceHeight = calculateBaseHeight(sourceLength);
  const targetHeight = calculateBaseHeight(targetLength);
  
  // Use the larger of the two heights to synchronize them
  const syncedHeight = Math.max(sourceHeight, targetHeight);
  
  // Determine font size based on character count
  const sourceFontSize = sourceLength > fontSizeThreshold ? '16px' : 'text-xl';
  const targetFontSize = targetLength > fontSizeThreshold ? '16px' : 'text-xl';
  
  // Update functions for character counts
  const updateSourceLength = useCallback((length: number) => {
    setSourceLength(length);
  }, []);
  
  const updateTargetLength = useCallback((length: number) => {
    setTargetLength(length);
  }, []);
  
  return {
    sourceHeight,
    targetHeight,
    syncedHeight,
    sourceFontSize,
    targetFontSize,
    updateSourceLength,
    updateTargetLength,
  };
} 
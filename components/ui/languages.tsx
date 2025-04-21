'use client';

import type { Variants } from 'motion/react';
import { motion, useAnimation } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface LanguagesIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface LanguagesIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const pathVariants: Variants = {
  initial: { opacity: 0, pathLength: 0, pathOffset: 1 },
  normal: { opacity: 1, pathLength: 1, pathOffset: 0 },
  animate: (custom: number) => ({
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      opacity: { duration: 0.01, delay: custom * 0.1 },
      pathLength: {
        type: 'spring',
        duration: 0.5,
        bounce: 0,
        delay: custom * 0.1,
        repeat: Infinity,
        repeatType: 'loop',
        repeatDelay: 0.2,
      },
      pathOffset: {
        repeat: Infinity,
        repeatType: 'loop',
        repeatDelay: 0.2,
      }
    },
  }),
};

const svgVariants: Variants = {
  initial: { opacity: 0 },
  normal: { opacity: 1 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      repeat: Infinity,
      repeatDelay: 0.5,
    },
  },
};

const LanguagesIcon = forwardRef<LanguagesIconHandle, LanguagesIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const svgControls = useAnimation();
    const pathControls = useAnimation();
    const [animationState, setAnimationState] = useState<'normal' | 'animate'>('normal');
    const isControlledRef = useRef(false);
    const isMountedRef = useRef(false);

    // Handle animation state changes after component is mounted
    useEffect(() => {
      isMountedRef.current = true;
      
      if (isControlledRef.current) {
        svgControls.start(animationState);
        pathControls.start(animationState);
      }
      
      return () => {
        isMountedRef.current = false;
      };
    }, [svgControls, pathControls, animationState]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => {
          setAnimationState('animate');
        },
        stopAnimation: () => {
          setAnimationState('normal');
        },
      };
    }, []);

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current && isMountedRef.current) {
          svgControls.start('animate');
          pathControls.start('animate');
        } else {
          onMouseEnter?.(e);
        }
      },
      [onMouseEnter, pathControls, svgControls]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current && isMountedRef.current) {
          svgControls.start('normal');
          pathControls.start('normal');
        } else {
          onMouseLeave?.(e);
        }
      },
      [svgControls, pathControls, onMouseLeave]
    );

    return (
      <div
        className={cn(
          `cursor-pointer select-none p-2 hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-center`,
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={svgVariants}
          initial="initial"
          animate={svgControls}
        >
          <motion.path
            d="m5 8 6 6"
            variants={pathVariants}
            custom={3}
            initial="initial"
            animate={pathControls}
          />
          <motion.path
            d="m4 14 6-6 3-3"
            variants={pathVariants}
            custom={2}
            initial="initial"
            animate={pathControls}
          />
          <motion.path
            d="M2 5h12"
            variants={pathVariants}
            custom={1}
            initial="initial"
            animate={pathControls}
          />
          <motion.path
            d="M7 2h1"
            variants={pathVariants}
            custom={0}
            initial="initial"
            animate={pathControls}
          />
          <motion.path
            d="m22 22-5-10-5 10"
            variants={pathVariants}
            custom={3}
            initial="initial"
            animate={pathControls}
          />
          <motion.path
            d="M14 18h6"
            variants={pathVariants}
            custom={3}
            initial="initial"
            animate={pathControls}
          />
        </motion.svg>
      </div>
    );
  }
);

LanguagesIcon.displayName = 'LanguagesIcon';

export { LanguagesIcon };

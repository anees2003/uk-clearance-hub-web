import React, { useRef } from 'react';
import { BedSetHandle, StudioScene } from '../three';

export const HomePage: React.FC = () => {
  const bedSetRef = useRef<BedSetHandle | null>(null);

  return (
    <section
      aria-label="3D Studio Bed Showcase"
      className="relative w-full h-screen -mt-20 overflow-hidden bg-[#F3EFE9]"
    >
      <StudioScene
        ref={bedSetRef}
        enableOrbitControls={true}
        showCornerProgress={true}
        className="w-full h-full"
      />
    </section>
  );
};

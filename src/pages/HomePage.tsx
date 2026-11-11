import React, { useCallback, useRef, useState } from 'react';
import { BedSetHandle, StudioScene } from '../three';
import {
  ASSEMBLY_CHAPTERS,
  useAssemblyTimeline,
} from '../animations/useAssemblyTimeline';
import { ScrollTrigger } from '../animations/gsap';
import { AssemblyChapterPanel } from '../components/home/AssemblyChapterPanel';
import { ChapterProgress } from '../components/ui/ChapterProgress';

export const HomePage: React.FC = () => {
  const bedSetRef = useRef<BedSetHandle | null>(null);
  const [bedSetHandle, setBedSetHandle] = useState<BedSetHandle | null>(null);
  const chaptersWrapperRef = useRef<HTMLDivElement | null>(null);

  const handleBedSetReady = useCallback((handle: BedSetHandle) => {
    bedSetRef.current = handle;
    setBedSetHandle(handle);
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }, []);

  useAssemblyTimeline({
    bedSet: bedSetHandle,
    chaptersWrapperRef,
  });

  return (
    <div className="relative w-full -mt-20">
      {/* Chapter Progress Bar (Desktop right-edge vertical track & stops, Mobile 2px top bar) */}
      <ChapterProgress chaptersWrapperRef={chaptersWrapperRef} />

      {/* Fixed Full-Screen 3D Studio Scene behind HTML content */}
      <div
        aria-hidden="true"
        className="fixed inset-0 w-screen h-screen z-0 pointer-events-none"
      >
        <StudioScene
          ref={bedSetRef}
          enableOrbitControls={false}
          showCornerProgress={false}
          initialAssembled={false}
          onBedSetReady={handleBedSetReady}
          className="w-full h-full pointer-events-none"
        />
      </div>

      {/* 8 Scroll-Driven Assembly Chapter Sections (100vh each) */}
      <div
        ref={chaptersWrapperRef}
        data-testid="assembly-chapters-wrapper"
        className="relative z-10 w-full pointer-events-none"
      >
        {ASSEMBLY_CHAPTERS.map((chapter) => (
          <AssemblyChapterPanel key={chapter.id} chapter={chapter} />
        ))}
      </div>

      {/* Solid #F3EFE9 Section Covering the Fixed 3D Canvas */}
      <section
        id="more-sections-coming"
        data-testid="more-sections-coming"
        className="relative z-20 h-screen w-full bg-[#F3EFE9] border-t border-[rgba(28,28,30,0.12)] flex items-center justify-center"
      >
        <p className="type-h2 text-[#1C1C1E]">More sections coming</p>
      </section>
    </div>
  );
};

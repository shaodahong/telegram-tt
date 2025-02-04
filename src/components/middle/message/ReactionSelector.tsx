import React, {
  FC, memo, useLayoutEffect, useRef,
} from '../../../lib/teact/teact';

import { ApiAvailableReaction, ApiMediaFormat } from '../../../api/types';

import useMedia from '../../../hooks/useMedia';
import useHorizontalScroll from '../../../hooks/useHorizontalScroll';
import useFlag from '../../../hooks/useFlag';
import useShowTransition from '../../../hooks/useShowTransition';
import { getTouchY } from '../../../util/scrollLock';

import ReactionStaticEmoji from '../../common/ReactionStaticEmoji';
import AnimatedSticker from '../../common/AnimatedSticker';

import './ReactionSelector.scss';

const REACTION_SIZE = 32;

type OwnProps = {
  enabledReactions?: string[];
  onSendReaction: (reaction: string, x: number, y: number) => void;
  isPrivate?: boolean;
  availableReactions?: ApiAvailableReaction[];
  isReady?: boolean;
};

const AvailableReaction: FC<{
  reaction: ApiAvailableReaction;
  isReady?: boolean;
  onSendReaction: (reaction: string, x: number, y: number) => void;
}> = ({ reaction, onSendReaction, isReady }) => {
  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<HTMLDivElement>(null);

  const mediaData = useMedia(`document${reaction.selectAnimation?.id}`, !isReady, ApiMediaFormat.Lottie);

  const [isActivated, activate, deactivate] = useFlag();
  const [isAnimationLoaded, markAnimationLoaded] = useFlag();

  const shouldRenderAnimated = Boolean(isReady && mediaData);
  const { transitionClassNames: animatedClassNames } = useShowTransition(shouldRenderAnimated);
  const { shouldRender: shouldRenderStatic, transitionClassNames: staticClassNames } = useShowTransition(
    !isReady || !isAnimationLoaded, undefined, true,
  );

  function handleClick() {
    if (!containerRef.current) return;
    const { x, y } = containerRef.current.getBoundingClientRect();

    onSendReaction(reaction.reaction, x, y);
  }

  return (
    <div
      className="reaction"
      onClick={handleClick}
      ref={containerRef}
      onMouseEnter={isReady ? activate : undefined}
    >
      {shouldRenderStatic && (
        <ReactionStaticEmoji className={isReady ? staticClassNames : undefined} reaction={reaction.reaction} />
      )}
      {shouldRenderAnimated && (
        <AnimatedSticker
          id={`select_${reaction.reaction}`}
          className={animatedClassNames}
          animationData={mediaData}
          play={isActivated}
          noLoop
          size={REACTION_SIZE}
          onLoad={markAnimationLoaded}
          onEnded={deactivate}
        />
      )}
    </div>
  );
};
const ReactionSelector: FC<OwnProps> = ({
  availableReactions,
  enabledReactions,
  onSendReaction,
  isPrivate,
  isReady,
}) => {
  // eslint-disable-next-line no-null/no-null
  const itemsScrollRef = useRef<HTMLDivElement>(null);
  const [isHorizontalScrollEnabled, enableHorizontalScroll] = useFlag(false);
  useHorizontalScroll(itemsScrollRef.current, !isHorizontalScrollEnabled);

  useLayoutEffect(() => {
    enableHorizontalScroll();
  }, [enableHorizontalScroll]);

  const handleWheel = (e: React.WheelEvent | React.TouchEvent) => {
    if (!itemsScrollRef) return;
    const deltaY = 'deltaY' in e ? e.deltaY : getTouchY(e);

    if (deltaY) {
      e.preventDefault();
    }
  };

  if ((!isPrivate && !enabledReactions?.length) || !availableReactions) return undefined;

  return (
    <div className="ReactionSelector" onWheelCapture={handleWheel} onTouchMove={handleWheel}>
      <div className="bubble-big" />
      <div className="bubble-small" />
      <div className="items-wrapper">
        <div className="items no-scrollbar" ref={itemsScrollRef}>
          {availableReactions?.map((reaction) => {
            if (reaction.isInactive
              || (!isPrivate && (!enabledReactions || !enabledReactions.includes(reaction.reaction)))) return undefined;
            return (
              <AvailableReaction
                key={reaction.reaction}
                isReady={isReady}
                onSendReaction={onSendReaction}
                reaction={reaction}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(ReactionSelector);

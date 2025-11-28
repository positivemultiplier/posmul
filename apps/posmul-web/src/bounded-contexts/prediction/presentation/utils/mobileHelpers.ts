"use client";

import { useEffect, useState } from "react";

// 모바일 디바이스 감지
export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, [breakpoint]);

  return isMobile;
};

// 터치 디바이스 감지
export const useIsTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          navigator.maxTouchPoints > 0
      );
    };

    checkTouchDevice();
  }, []);

  return isTouchDevice;
};

// 안전 영역 감지 (iPhone X 노치 등)
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue("--sat") || "0", 10),
        bottom: parseInt(computedStyle.getPropertyValue("--sab") || "0", 10),
        left: parseInt(computedStyle.getPropertyValue("--sal") || "0", 10),
        right: parseInt(computedStyle.getPropertyValue("--sar") || "0", 10),
      });
    };

    updateSafeArea();
    window.addEventListener("resize", updateSafeArea);
    window.addEventListener("orientationchange", updateSafeArea);

    return () => {
      window.removeEventListener("resize", updateSafeArea);
      window.removeEventListener("orientationchange", updateSafeArea);
    };
  }, []);

  return safeArea;
};

// 뷰포트 높이 감지 (모바일 주소창 고려)
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
      // CSS 커스텀 속성으로도 설정
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", () => {
      setTimeout(updateViewportHeight, 100); // 딜레이 추가
    });

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);

  return viewportHeight;
};

// 스와이프 제스처 감지
export const useSwipeGesture = (options) => {
  const threshold = options?.threshold || 50;
  const onSwipeLeft = options?.onSwipeLeft;
  const onSwipeRight = options?.onSwipeRight;
  const onSwipeUp = options?.onSwipeUp;
  const onSwipeDown = options?.onSwipeDown;

  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const onTouchStart = (e) => {
    setTouchEnd({ x: 0, y: 0 });
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEndHandler = () => {
    if (!touchStart.x || !touchStart.y || !touchEnd.x || !touchEnd.y) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // 수평 스와이프
      if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
      if (isRightSwipe && onSwipeRight) onSwipeRight();
    } else {
      // 수직 스와이프
      if (isUpSwipe && onSwipeUp) onSwipeUp();
      if (isDownSwipe && onSwipeDown) onSwipeDown();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: onTouchEndHandler,
  };
};

import React, {
  forwardRef,
  useContext,
  useImperativeHandle,
  useMemo,
} from 'react';
import { useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { BottomSheetDraggableContext } from '../../contexts/gesture';
import {
  useScrollHandler,
  useScrollableSetter,
  useBottomSheetInternal,
  useStableCallback,
} from '../../hooks';
import {
  SCROLLABLE_DECELERATION_RATE_MAPPER,
  SCROLLABLE_STATE,
  SCROLLABLE_TYPE,
} from '../../constants';
import { ScrollableContainer } from './ScrollableContainer';

export function createBottomSheetScrollableComponent<T, P>(
  type: SCROLLABLE_TYPE,
  ScrollableComponent: any
) {
  return forwardRef<T, P>((props, ref) => {
    // props
    const {
      // hooks
      focusHook,
      scrollEventsHandlersHook,
      // props
      customContentHeight,
      enableFooterMarginAdjustment = false,
      overScrollMode = 'never',
      keyboardDismissMode = 'interactive',
      showsVerticalScrollIndicator = true,
      style,
      refreshing,
      onRefresh,
      progressViewOffset,
      refreshControl,
      // events
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
      onContentSizeChange,
      ...rest
    }: any = props;

    //#region hooks
    const draggableGesture = useContext(BottomSheetDraggableContext);
    const { scrollableRef, scrollableContentOffsetY, scrollHandler } =
      useScrollHandler(
        scrollEventsHandlersHook,
        onScroll,
        onScrollBeginDrag,
        onScrollEndDrag
      );
    const {
      animatedFooterHeight,
      animatedContentHeight,
      animatedScrollableState,
      enableDynamicSizing,
    } = useBottomSheetInternal();
    //#endregion

    //#region variables
    const scrollableAnimatedProps = useAnimatedProps(
      () => ({
        decelerationRate:
          SCROLLABLE_DECELERATION_RATE_MAPPER[animatedScrollableState.value],
        showsVerticalScrollIndicator: showsVerticalScrollIndicator
          ? animatedScrollableState.value === SCROLLABLE_STATE.UNLOCKED
          : showsVerticalScrollIndicator,
      }),
      [animatedScrollableState, showsVerticalScrollIndicator]
    );

    const nativeGesture = useMemo(
      () =>
        Gesture.Native()
          // @ts-ignore
          .simultaneousWithExternalGesture(draggableGesture!)
          .shouldCancelWhenOutside(false),
      [draggableGesture]
    );
    //#endregion

    //#region callbacks
    const handleContentSizeChange = useStableCallback(
      (contentWidth: number, contentHeight: number) => {
        if (enableDynamicSizing) {
          animatedContentHeight.value =
            (customContentHeight ? customContentHeight : contentHeight) +
            (enableFooterMarginAdjustment ? animatedFooterHeight.value : 0);
        }

        if (onContentSizeChange) {
          onContentSizeChange(contentWidth, contentHeight);
        }
      }
    );
    //#endregion

    //#region styles
    const containerAnimatedStyle = useAnimatedStyle(
      () => ({
        marginBottom: enableFooterMarginAdjustment
          ? animatedFooterHeight.value
          : 0,
      }),
      [animatedFooterHeight.value, enableFooterMarginAdjustment]
    );
    const containerStyle = useMemo(() => {
      return enableFooterMarginAdjustment
        ? [
            ...(style ? ('length' in style ? style : [style]) : []),
            containerAnimatedStyle,
          ]
        : style;
    }, [enableFooterMarginAdjustment, style, containerAnimatedStyle]);
    //#endregion

    //#region effects
    // @ts-ignore
    useImperativeHandle(ref, () => scrollableRef.current);
    useScrollableSetter(
      scrollableRef,
      type,
      scrollableContentOffsetY,
      onRefresh !== undefined,
      focusHook
    );
    //#endregion

    //#region render
    return (
      <ScrollableContainer
        ref={scrollableRef}
        nativeGesture={nativeGesture}
        animatedProps={scrollableAnimatedProps}
        overScrollMode={overScrollMode}
        keyboardDismissMode={keyboardDismissMode}
        refreshing={refreshing}
        scrollEventThrottle={16}
        progressViewOffset={progressViewOffset}
        style={containerStyle}
        onRefresh={onRefresh}
        onScroll={scrollHandler}
        onContentSizeChange={handleContentSizeChange}
        ScrollableComponent={ScrollableComponent}
        refreshControl={refreshControl}
        {...rest}
      />
    );
    //#endregion
  });
}

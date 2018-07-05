/* @flow */
import * as React from "react";
import {Animated, PanResponder, ScrollView, View} from "react-native";

const distanceThreshold = 100;
const speedThreshold = 0.75;

type BottomSheetPropTypes = {|
    children: React.Node,
    peekViewHeight: number,
    stickyHeaderIndices?: Array<number>,
    style?: StyleSheet
|}

type BottomSheetStateTypes = {|
    sheetState:
        | "expanded"
        | "expanding"
        | "minimized"
        | "minimizing"
        | "dismissed"
        | "dismissing"
|};

export class BottomSheet extends React.PureComponent<
    BottomSheetPropTypes,
    BottomSheetStateTypes
> {
    state = {
        sheetState: "dismissed"
    };

    componentWillMount() {
        this.panResponder = this.createPanResponder();
    }

    panResponder: PanResponder;
    dragAnimated = new Animated.ValueXY();
    contentHeight = -1;
    springToValues = {x: 0, useNativeDrive: true};
    currentScrollY = 0;
    scrollView: ScrollView;

    createPanResponder = () =>
        PanResponder.create({
            onStartShouldSetPanResponder: (e, {dy}) =>
                this.consumeTouchOverScroll(dy),
            onMoveShouldSetPanResponder: (e, {dy}) =>
                this.consumeTouchOverScroll(dy),
            onPanResponderMove: Animated.event([
                null,
                {
                    dx: 0,
                    dy: this.dragAnimated.y
                }
            ]),
            onPanResponderGrant: this.resetDragAnimatedOffset,
            onPanResponderRelease: (e, {dy, vy}) => this.snapView(dy, vy)
        });

    sheetAlreadyExpanded = () => this.state.sheetState === "expanded";

    sheetAlreadyDismissed = () => this.state.sheetState === "dismissed";

    sheetAlreadyMinimized = () => this.state.sheetState === "minimized";

    swipeFast = (swipeSpeed: number) => Math.abs(swipeSpeed) > speedThreshold;

    swipeFar = (swipeDistance: number) =>
        Math.abs(swipeDistance) > distanceThreshold;

    swipeDown = (swipeDistance: number) => swipeDistance > 0;

    notExpandedYet = () => this.state.sheetState !== "expanded";

    scrolledOnTop = () => this.currentScrollY <= 0;

    resetDragAnimatedOffset = () => {
        this.dragAnimated.setOffset({
            x: this.dragAnimated.x._value,
            y: this.dragAnimated.y._value
        });
        this.dragAnimated.setValue({x: 0, y: 0});
    };

    snapView = (swipeDistance: number, swipeSpeed: number) => {
        this.dragAnimated.flattenOffset();
        if (swipeDistance === 0) return;
        if (this.swipeDown(swipeDistance)) {
            this.swipeDownAction(swipeDistance, swipeSpeed);
        } else {
            this.swipeUpAction(swipeDistance, swipeSpeed);
        }
    };

    swipeDownAction(swipeDistance: number, swipeSpeed: number) {
        if (this.state.sheetState === "minimized") {
            this.dismiss();
        } else if (this.sheetAlreadyExpanded()) {
            if (this.swipeFast(swipeSpeed)) this.dismiss();
            else if (this.swipeFar(swipeDistance)) this.dismiss();
            else this.expand();
        } else {
            this.dismiss();
        }
    }

    swipeUpAction(swipeDistance: number, swipeSpeed: number) {
        if (this.sheetAlreadyDismissed()) {
            this.minimize();
        } else if (this.sheetAlreadyMinimized()) {
            if (this.swipeFast(swipeSpeed)) this.expand();
            else if (this.swipeFar(swipeDistance)) this.expand();
            else this.minimize();
        } else {
            this.expand();
        }
    }

    animateToBottom = () =>
        Animated.spring(this.dragAnimated, {
            toValue: {...this.springToValues, y: this.contentHeight}
        });

    dismiss = () => {
        this.dragAnimated.stopAnimation();
        this.state.sheetState="dismissing";
        // this.setState({sheetState: "dismissing"}, this.props.onViewDismissing);
        this.animateToBottom().start(() => {
            this.state.sheetState="dismissed";
            // this.setState(
            //     {sheetState: "dismissed"},
            //     this.props.onViewDismissed
            // );
        });
    };

    animateToPeek = () =>
        Animated.spring(this.dragAnimated, {
            toValue: {
                ...this.springToValues,
                y: this.contentHeight - (this.props.peekViewHeight || 0)
            }
        });

    minimize = () => {
        this.dragAnimated.stopAnimation();
        if (this.scrollView) this.scrollView.scrollTo({y: 0, animated: false});
        // this.setState({sheetState: "minimizing"}, this.props.onViewMinimizing);
        this.state.sheetState="minimizing";
        this.animateToPeek().start(() => {
            this.state.sheetState="minimized";
            // this.setState(
            //     {sheetState: "minimized"},
            //     this.props.onViewMinimized
            // );
        });
    };

    animateToTop = () =>
        Animated.timing(this.dragAnimated, {
            toValue: {
                ...this.springToValues,
                y: 0
            },
            duration: 320
        });

    expand = (preventAnimationIfAlreadyExpanded: boolean = false) => {
        if (preventAnimationIfAlreadyExpanded && this.sheetAlreadyExpanded())
            return;
        this.dragAnimated.stopAnimation();
        this.state.sheetState="expanding";
        // this.setState({sheetState: "expanding"}, this.props.onViewExpanding);
        this.animateToTop().start(() => {
            this.state.sheetState="expanded";
            // this.setState({sheetState: "expanded"}, this.props.onViewExpanded);
        });
    };

    consumeTouchOverScroll = (swipeDistance: number) =>
        this.notExpandedYet() ||
        (this.swipeDown(swipeDistance) && this.scrolledOnTop());

    setCurrentScrollPosition = (y: number) => {
        this.currentScrollY = y;
    };

    setLayoutHeight = (layoutHeight: number) => {
        if (this.contentHeight === -1) {
            this.contentHeight = layoutHeight;
            this.dragAnimated.setValue({x: 0, y: layoutHeight});
        }
    };

    setScrollView = (ref: ?ScrollView) => {
        if (ref) this.scrollView = ref;
    };

    render() {
        console.log("hit here2");
        const {style, stickyHeaderIndices} = this.props;
        return (
            <Animated.View
                style={this.dragAnimated.getLayout()}
                onLayout={e =>
                    this.setLayoutHeight(e.nativeEvent.layout.height)
                }
                {...this.panResponder.panHandlers}
            >
                <View style={style}>
                    <ScrollView
                        ref={this.setScrollView}
                        scrollEnabled={this.sheetAlreadyExpanded()}
                        scrollEventThrottle={16}
                        stickyHeaderIndices={stickyHeaderIndices}
                        onScroll={e =>
                            this.setCurrentScrollPosition(
                                e.nativeEvent.contentOffset.y
                            )
                        }
                    >
                        {this.props.children}
                    </ScrollView>
                </View>
            </Animated.View>
        );
    }
}

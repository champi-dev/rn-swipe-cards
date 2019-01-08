import React, { Component } from 'react'
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  LayoutAnimation,
  UIManager
} from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25
const SWIPE_OUT_DURATION = 250

export default class Deck extends Component {
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {}
  }

  componentWillMount() {
    this._position = new Animated.ValueXY()
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gesture) => {
        this._position.setValue({ x: gesture.dx, y: gesture.dy })
      },
      onPanResponderRelease: (evt, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.forceSwipe('right')
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipe('left')
        } else {
          this.resetPosition()
        }
      }
    })
  }

  state = {
    index: 0
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 })
    }
  }

  componentWillUpdate() {
    // enable for android
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true)
    LayoutAnimation.spring()
  }

  forceSwipe = direction => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH
    const swipeMultiplier = 1.2

    Animated.timing(this._position, {
      toValue: { x: x * swipeMultiplier, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => this.onSwipeComplete(direction))
  }

  onSwipeComplete = direction => {
    const { onSwipeLeft, onSwipeRight, data } = this.props
    const item = data[this.state.index]

    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item)
    this._position.setValue({ x: 0, y: 0 })
    this.setState({ index: this.state.index + 1 })
  }

  resetPosition = () => {
    Animated.spring(this._position, {
      toValue: { x: 0, y: 0 }
    }).start()
  }

  getCardStyle = () => {
    const rotate = this._position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 2, 0, SCREEN_WIDTH * 2],
      outputRange: ['-120deg', '0deg', '120deg']
    })

    return {
      ...this._position.getLayout(),
      transform: [{ rotate }]
    }
  }

  renderCards = () => {
    if (this.state.index >= this.props.data.length) {
      return this.props.renderNoMoreCards()
    }

    return this.props.data.map((item, pos) => {
      if (pos < this.state.index) return null

      if (pos === this.state.index) {
        return (
          <Animated.View
            key={item.id}
            {...this._panResponder.panHandlers}
            style={[
              this.getCardStyle(),
              styles.cardStyle,
              { zIndex: pos * -1 }
            ]}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        )
      }

      if (pos > this.state.index) {
        return (
          <Animated.View
            key={item.id}
            style={[
              styles.cardStyle,
              { zIndex: pos * -1 },
              { top: 10 * (pos - this.state.index) }
            ]}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        )
      }
    })
  }

  render() {
    return <View>{this.renderCards()}</View>
  }
}

const styles = {
  cardStyle: {
    position: 'absolute',
    width: '100%'
  }
}

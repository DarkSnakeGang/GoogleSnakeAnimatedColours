# Animated Colours for Google Snake

This project lets you have different animated patterns for the snake, and also for the background. **Not recommended for people with photosensitive epilepsy**.

To install:
Download the bookmark file in [releases](https://github.com/DarkSnakeGang/GoogleSnakeAnimatedColours/releases/tag/1.0)
Import the bookmark into your browser
Start playing google snake
Click the bookmark
Switch to the rainbow snake

### Console commands

Commands can be entered in the developer console to access different patterns
On Chrome this can be accessed by ctrl+shift+j

The syntax is 

`snake.animate("nameOfSnakePattern")`

Or if using a background pattern

`snake.animate("nameOfSnakePattern","nameOfBackgroundPattern")`

Where nameOfSnakePattern can be any of the following:
- defaultPattern
- seizure
- temporalRainbow
- rollingRainbow
- rollingRainbowRev
- strobeRainbow
- variation
- variationV2

**All these patterns will be laggy, but temporalRainbow, rollingRainbow, rollingRainbowRev are much less laggy**

And nameOfBackgroundPattern can be any of the following:
- randomHexBg
- randomHexSameBg
- temporalBg
- rollingRainbowBg
- rollingRainbowBgOld

The patterns can be slowed down (Or sped up) by `animateSnakeGlobals.framesPerSecond = 5`
where 5 is the framerate of the animation (replace this with any other number).
60 is the default. Values over 60 can be buggy.
This won't take effect until you re-enter the snake.animate command.

### Commands for easy copying and pasting


  //Snake body
  
  snake.animate("defaultPattern")
  
  snake.animate("seizure")
  
  snake.animate("temporalRainbow")
  
  snake.animate("rollingRainbow")
  
  snake.animate("rollingRainbowRev")
  
  snake.animate("strobeRainbow")
  
  snake.animate("variation")
  
  snake.animate("variationV2")
  
  //Snake background - (other patterns can be used than temporalRainbow for the snake)
  
  snake.animate("temporalRainbow","randomHexBg")
  
  snake.animate("temporalRainbow","randomHexSameBg")
  
  snake.animate("temporalRainbow","temporalBg")
  
  snake.animate("temporalRainbow","rollingRainbowBg")
  
  snake.animate("temporalRainbow","rollingRainbowBgOld")


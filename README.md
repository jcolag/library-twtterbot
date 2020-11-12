# library-twtterbot
A TwitterBot intended to provide links when someone provides keywords

This project is intended to make it easier to make sure that consistent links are available in Twitter discussions by replying when invoked with keywords.  A simple example might follow a transcript like this.

 > **Taylor_jWcxJMAAjn**:  It's pretty obvious that room-temperature superconductors don't exist.
 >
 > **Saito_yzgSXqzfQD**:  @Taylor_jWcxJMAAjn Not necessarily @replybrary superconductor
 >
 > **replybrary**:  I have this for superconductors: https://www.futurity.org/superconductor-room-temperature-2455692/

My plan is to use [@replybrary](https://twitter.com/replybrary) itself for sociological links around which policies work and which do not, but that's just my personal agenda.  If *you* use this, you should try to fact-check your links before including them, otherwise your project to enlighten people will flop quickly.

The code will read mentions on startup (to a maximum of 200, minus deleted and otherwise hidden tweets) and process them, skipping any previously-seen tweets, as part of the start-up.  So, in the event of a crash, the program should be able to pick up whatever it missed while it was down, assuming that there haven't been two hundred requests before you can fix the problem.

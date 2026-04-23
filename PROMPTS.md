# Used Prompts
| Prompt | What I expected | What I got | What I changed |
|---|---|---|---|
| what is the best way to make sure "Time left" will update every second? | I wanted to see if there is an elgant way to update the time left every second | The AI suggested I will rerender the page using 'setNow' (changing a usestate variable) | Added "const [, setNow] = React.useState(Date.now());" and called it every second with setInterval |
| help me think of a different way to make the light and dark mode work because for a split second when loading or reloading the page it shows the default page color which is white so if you refresh while in dark mode it flashes the entire screen white. other than that it works fine | I wanted to see if there is a simple solution to make the page initially load as the current theme color so it want flash every time you reload the page in dark mode | It told me to change document.documentElement in index.html and it helped but caused other problems | after a while of trying to fix bugs caused by the theme I decided to force the theme to be dark for now because it was not asked for anyways |
| why does overFlowY in historyWindow not work? when I inspect element and manually add that it works but for some reason it's not there | When setting up AuctionView it ignored my attempt to make the overflow of the Y axis scrollable | The AI told me that I accidently used the wrong casing | changed "overFlowY" to "overflowY" |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
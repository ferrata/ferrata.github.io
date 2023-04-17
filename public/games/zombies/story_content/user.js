function ExecuteScript(strId)
{
  switch (strId)
  {
      case "5tOVhwDjk57":
        Script1();
        break;
  }
}

function Script1()
{
  const zeroPad = (num, places) => String(num).padStart(places, '0');

setInterval(function() {
	const player = GetPlayer();
	const elapsed = player.GetVar('game_time_elapsed_ms');
    player.SetVar('game_time_elapsed_ms', elapsed + 125);

    const limit = player.GetVar('game_time_limit_ms');
    const timeLeft = limit - elapsed;
    
    const milliseconds = parseInt(timeLeft%1000);
    const seconds = parseInt((timeLeft/1000)%60);
    const minutes = parseInt((timeLeft/(1000*60))%60);
    
    player.SetVar('game_time_elapsed', `${zeroPad(minutes, 2)}:${zeroPad(seconds, 2)}.${zeroPad(milliseconds, 3)}`);
}, 125);



}


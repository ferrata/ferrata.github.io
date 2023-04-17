function ExecuteScript(strId)
{
  switch (strId)
  {
      case "6HNbThZ1u1u":
        Script1();
        break;
  }
}

function Script1()
{
  const zeroPad = (num, places) => String(num).padStart(places, '0');
const player = GetPlayer();

// console.log('1. game_timer_set', player.GetVar('game_timer_set'));

if (!player.GetVar('game_timer_set')) {
	player.SetVar('game_timer_set', new Date().getTime().toString());
	
	// console.log('2. calling setInterval');

	setInterval(function() {
		const started = parseInt(player.GetVar('game_timer_set'));
		const elapsed = new Date().getTime() - started;
	    player.SetVar('game_time_elapsed_ms', elapsed);
	
	    const limit = player.GetVar('game_time_limit_ms');
	    const timeLeft = limit - elapsed;
	    
	    const milliseconds = parseInt(timeLeft%1000);
	    const seconds = parseInt((timeLeft/1000)%60);
	    const minutes = parseInt((timeLeft/(1000*60))%60);
	    
	    player.SetVar('game_time_elapsed', `${zeroPad(minutes, 2)}:${zeroPad(seconds, 2)}.${zeroPad(milliseconds, 3)}`);
	}, 150);
}



}


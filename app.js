import { updateManualSports } from "./sports.js";

onValue(ref(db,"manual"),(snapshot)=>{

    const data = snapshot.val();

    updateManualSports(data);

});
import {

fetchWeather,
updateManualWeather

} from "./weather.js";

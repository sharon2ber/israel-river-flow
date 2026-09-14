/* ============================================================
   River Flow Israel
   ============================================================ */

/* ---------- i18n ---------- */
const I18N = {
  en: {
    live:"LIVE STREAMFLOW", title:"River Flow Israel",
    tagline:"Direction, force and condition of Israel's rivers and wadis.",
    s_lang:"LANGUAGE", s_ctl:"MAP CONTROLS", c_speed:"Flow speed", c_min:"Show from", c_day:"Day",
    o_all:"all", s_layers:"MAP LAYERS", l_st:"Gauging stations", l_res:"Dams & reservoirs",
    l_nm:"River names", l_an:"Flow vs normal", s_search:"SEARCH THE MAP", s_about:"ABOUT",
    b_about:"About the data", s_leg:"STREAMFLOW",
    legnote:"Colour and width show discharge (m³/s, log scale). Only corroborated flow moves: a dashed violet line is the model claiming water that nothing else supports, and a dotted line is no data at all. Basins are drawn as outlines because this map does not know what is in them today.",
    b_h:"Building Israel\u2019s stream network",
    b_p:"Fetching Israel's streams from the Water Authority, then asking the GloFAS flood model how much water is moving through them today. This happens once \u2014 after that it is cached in your browser.",
    ph:"Nahal Yarkon…",
    reaches:"river reaches", modelled:"with modelled flow", flowing:"flowing today", gauges:"gauging stations", asof:"showing", dunit:"days",
    drag:"Drag to explore", hover:"Hover a river", click:"Click for details",
    unknown:"no model data", dry:"dry \u2014 no flow", under:"under", over:"over",
    modelPill:"modelled", measPill:"measured",
    today:"today", q_now:"Modelled discharge", basin:"Basin", type:"Type",
    river:"River", stream:"Stream / wadi", canal:"Canal", intermittent:"intermittent",
    perennial:"perennial", vsnorm:"vs. normal for this date", pct:"percentile",
    computing:"computing…", nodata:"no data", length:"Length",
    st_area:"Catchment", st_rec:"Record", st_years:"years", st_vol:"Mean annual volume",
    st_max:"Peak discharge on record", st_on:"on", st_status:"Active gauge", st_id:"Station",
    fc:"7-day forecast", past:"past 7 days", much_below:"much below normal",
    below:"below normal", normal:"near normal", above:"above normal", much_above:"much above normal",
    s_base:"BASEMAP", b_base:"Change basemap",
    bm_dark:"Dark", bm_labels:"Place names", bm_hill:"Elevation \u2014 hillshade",
    bm_topo:"Topographic \u2014 contours", bm_sat:"Satellite",
    bm_hint:"Relief shading makes the Jordan Rift and the Negev read as terrain, so it is obvious which way water runs.",
    l_samp:"Pollution sampling points", l_bord:"Israel\u2019s borders", l_cross:"Where water crosses Israel\u2019s border",
    crossing:"Crosses Israel\u2019s border", cross_of:"crossing of",
    b_int:"international boundary", b_indef:"indefinite boundary",
    b_disp:"disputed boundary", b_loc:"line of control", b_arm:"armistice line",
    rel:"Reliability", rel_own:"model cell reading", rel_fill:"filled from the river profile",
    rel_low:"too patchy to show", rel_note:"Flow is smoothed along each river so a coarse model grid cannot make it stop and start.",
    inflow:"flows in from", outflow:"flows out to",
    sampling:"Stream pollution sampling point", samp_of:"on",
    elev_from:"Elevation", elev_drop:"Falls", elev_grad:"Gradient",
    src_official:"Water Authority", src_osm:"OpenStreetMap", src_net:"National stream network",
    src_gapfill:"This stretch is missing from the Water Authority layer and was filled from Israel\u2019s national stream network.",
    segs:"segments", wholeriver:"whole river",
    cache:"Rebuild network cache", err:"Could not load the river network.",
    errhint:"The public Overpass servers throttle heavy requests, so this is usually temporary \u2014 give it a minute and retry. You can also open the map without rivers: the gauging stations and basemap still work.",
    without:"Continue without rivers",
    partial:"OpenStreetMap fill-in incomplete \u2014 %n of %t areas did not load.",
    retry:"Retry", noresult:"nothing found",
    home:"Back to Israel",
    ev:"Evidence", ev_rain:"Rain on this cell", ev_rain_days:"over %n days",
    reg:"Flow regime, measured", reg_gauge:"from the gauge at",
    reg_P:"perennial \u2014 runs all year", reg_N:"near-perennial \u2014 most of the year",
    reg_S:"seasonal \u2014 the wet season only", reg_R:"rare \u2014 flows once in several years",
    reg_U:"record too short to classify", reg_none:"no gauge on this stream",
    reg_sum:"%p of summer days carried water, %y years of record",
    reg_yrs:"water in %f of years, %y years of record",
    reg_far:"nearest gauge on this stream is %d km away, so this is the stream\u2019s name matching, not this reach",
    au_rivers:"named rivers on the map", au_frag:"still drawn in more than one piece",
    au_broken:"changing drawn state more than twice along their length",
    au_filled:"stretches filled from the national network",
    au_worst:"Most broken", au_row:"%p pieces, %b changes of state, largest gap %g km",
    au_note:"Counted on every load. A river in more than one piece is usually a hole in the source that the national network could not fill; changes of state along one river are the map disagreeing with itself and should be rare.",
    gap_working:"Filling gaps in the mapped network \u2014 %p%, %r",
    gap_done:"Filled %n rivers the official layer leaves incomplete, %s new stretches, from the national stream network.",
    close:"Close",
    g_water:"Water", g_measure:"Measurement", g_context:"Context", g_marks:"Labels & analysis",
    bs_basin:"Catchment", bs_catchrain:"Rain on the catchment",
    bs_over:"wettest cell across %n basins, %c cells",
    bs_note:"Drainage basins from Israel's national GIS. Rain is taken as the wettest cell anywhere in this stream's catchment, upstream basins included \u2014 the question is whether water could be moving at all, not how much.",
    l_radar:"Weather radar \u2014 live", ev_radar:"Radar, now",
    ev_radar_wet:"rain over this catchment", ev_radar_dry:"no echo",
    ev_why_radar:"The weather radar is showing rain over this catchment right now. That is an observation, not a model, and it is the strongest evidence this map has.",
    ev_why_radarup:"The radar is showing rain upstream of here right now. Water from it reaches this stretch.",
    radar_note:"RainViewer composite, the most recent of thirteen frames covering the past two hours. Radar evidence applies to today only.",
    ev_why_rain:"Rain has fallen on this catchment within the last %n days, so the model\u2019s water has somewhere to have come from.",
    ev_why_carried:"This reach is below a stretch that is flowing. Water does not stop and restart down one channel, so it is carried here rather than being judged again on its own cell.",
    ev_rain_up:"upstream; %c mm on this reach\u2019s own cell",
    ev_trans:"Where this river changes", l_trans:"Where a river changes state",
    sp_layer:"Springs \u2014 measured", sp_mean:"Mean discharge", sp_summer:"Summer mean (Jul\u2013Sep)",
    sp_last:"Latest measurement", sp_wet:"measurements finding water", sp_n:"measurements",
    sp_reg:"measured regularly", sp_survey:"survey spring", sp_old:"no longer measured", sp_unk:"unspecified",
    sp_feeds:"Source feeding this reach",
    sp_note:"Israel Hydrological Service springs register and measured discharge, via data.gov.il. Litres per second, aggregated from every recorded measurement at this spring.",
    ev_why_spring:"No rain has fallen, but %s is putting about %v litres a second into this channel at or above here. A stream below a live source runs without rain.",
    tr_open:"Trace this river segment by segment", tr_unnamed:"Unnamed watercourse",
    tr_lede:"Every number the map used, in the order the water runs. A dashed line is a break in the source data.",
    tr_fetch:"Asking the national stream network about this river\u2026",
    tr_acc:"Upstream network", tr_net:"The national stream network has this river as one connected watercourse, Strahler order %o. The figure below is accumulated upstream channel length \u2014 the total length of everything draining into each point, %k km at the mouth. It rises strictly downstream, which is what makes it a measured order rather than one inferred from terrain.",
    tr_nonet:"The national stream network has no spine for this river, so its order comes from the elevation of each model cell \u2014 an approximation.",
    tr_mouth_ok:"Our drawn line reaches that mouth.",
    tr_mouth_gap:"Our drawn line stops %d km short of that mouth \u2014 the missing part is absent from the sources this map draws from.",
    tr_pieces:"pieces it was cut into", tr_maxgap:"largest gap", tr_coast:"end to coastline",
    tr_nodata:"segments with no model value",
    tr_short:"The drawn line stops %d km from the coast at an elevation that says it should be an outlet. The missing part is not in the Water Authority layer and was not filled by OpenStreetMap \u2014 the map ends where its sources end, and does not draw a channel it has no evidence for.",
    tr_split:"This river arrived as %n disconnected pieces, the largest gap being %g km. Pieces further apart than 3 km are judged separately, because a shared name is not proof that two channels are the same river.",
    tr_gap:"break in the source data \u2014 %g km with no mapped channel",
    ev_why_perennial:"No rain has fallen, but this stream carried water through 80% or more of the summer days in the Hydrological Service record. A perennial stream runs without rain, so the model is believed here.",
    ev_why_rare:"The model reports water, no rain has fallen, and the gauge record shows this channel carries water in fewer than 60% of years. Measurement outranks the model: the map shows dry.",
    ev_why_seasonal:"The model reports water, no rain has fallen, and the gauge record shows this channel runs in the wet season only. Measurement outranks the model: the map shows dry.",
    ev_why_nearperennial:"This stream runs much of the year but not through the summer, and no rain has fallen. Neither claim is supported, so the map makes none.",
    cmp:"Model against the measured record", cmp_matched:"reaches matched to a gauged stream",
    cmp_over:"the model claims water where the record says dry",
    cmp_under:"the model claims dry on a stream that runs all year",
    cmp_none:"No contradictions on this day.",
    cmp_note:"Counted fresh on every load, not asserted once. Each row names the gauge it is judged against.",
    ev_flow:"model, corroborated by rain", ev_dry:"dry \u2014 model and rain agree",
    ev_stopped:"dry \u2014 no rain, ephemeral channel",
    ev_unver:"unverified", ev_none:"no model value",
    ev_model_says:"model says",
    ev_nocheck_why:"The rain check could not run for this cell, so nothing here has been corroborated \u2014 this is the model on its own. It is not a statement that the channel is dry.",
    ev_unver_why:"The model reports water here, but no rain has fallen on this cell and nothing tells us this channel runs year-round. So the map does not claim it is flowing, and does not claim it is dry either.",
    ev_stopped_why:"The model reports water, no rain has fallen on this cell, and OpenStreetMap maps this channel as intermittent. In Israel that means dry, so the map shows dry and overrules the model.",
    l_basin:"Basin \u2014 contents unknown",
    w_body:"Water body", w_kind:"Mapped as", w_area:"Area", w_tags:"OSM tags",
    w_lake:"Natural lake", w_saltlake:"Salt lake", w_reservoir:"Reservoir", w_basin:"Basin",
    w_unspecified:"Water, no type given in OSM",
    w_seasonal:"Seasonal water", w_saltpond:"Evaporation pond", w_pond:"Pond",
    w_unknown:"Water, unspecified",
    w_wet:"Permanent \u2014 drawn as water",
    w_dry:"This map does not know whether it holds water today, so it is drawn as an outline, not as water. Most basins in Israel stand empty through the summer.",
    w_src:"Outline from OpenStreetMap contributors. Not checked against imagery.",
    ver:"Verification", ver_run:"Run the check against the gauge network",
    ver_running:"Checking the model against %n gauges…",
    ver_again:"Run it again", ver_when:"last run",
    ver_model:"Model, 10-year mean", ver_meas:"Measured, mean annual",
    ver_ratio:"Model \u00f7 measured", ver_n:"gauges compared",
    ver_w2:"agree within a factor of 2", ver_w3:"within a factor of 3",
    ver_rho:"rank correlation across gauges",
    ver_seas:"late-summer flow as a share of winter, modelled",
    ver_dry:"gauge cells the model calls dry in late summer",
    ver_bias:"median bias", ver_over:"model runs high", ver_under:"model runs low",
    ver_fail:"Could not reach the model archive \u2014 try again in a minute.",
    ver_none:"Not checked yet.",
    ver_worst:"Furthest off", ver_best:"Closest",
    ver_baked:"shipped with this map, computed", ver_live:"run in this browser",
    ver_slow:"Re-running it live takes about thirteen minutes: the model archive is rate-limited on the free tier, so the check goes four gauges a minute.",
    ver_years:"years of reanalysis",
    v_mag_good:"The model gets the size of an Israeli stream roughly right.",
    v_mag_ok:"The model gets the size of an Israeli stream right about as often as not.",
    v_mag_poor:"The model is not a substitute for a gauge: on most streams its number is off by more than a factor of three.",
    v_rank_good:"It ranks the network well \u2014 bigger streams read as bigger.",
    v_rank_ok:"It ranks the network reasonably \u2014 bigger streams usually read as bigger, which is what the colour scale asks of it.",
    v_rank_poor:"It does not even rank the network reliably, so read the colours as a hint and nothing more.",
    v_bias_high:"It runs high, by about \u00d7%x at the median.",
    v_bias_low:"It runs low, by about \u00f7%x at the median.",
    v_bias_ok:"It carries little overall bias.",
    v_dry:"Its weakest point is summer: it empties only %p of gauge cells in August and September, and holds late-summer flow at %s of winter, where most Israeli wadis simply stop. Treat a blue line in late summer with suspicion unless the stream is spring-fed or carries effluent \u2014 the flow-vs-normal layer is the honest way to read that season, because a percentile cancels the model\u2019s standing baseflow.",
    ver_note:"Each gauge\u2019s measured mean annual volume, converted to m\u00b3/s, against the model\u2019s own mean at the same coordinates. Different periods and a 5 km cell against a gauge section: this tests order of magnitude and rank, which is what the map claims."
  },
  he: {
    live:"ספיקה בזמן אמת", title:"זרימה בנחלי ישראל",
    tagline:"כיוון, עוצמה ומצב הזרימה בנחלים ובוואדיות של ישראל.",
    s_lang:"שפה", s_ctl:"בקרות מפה", c_speed:"מהירות זרימה", c_min:"הצג מ־", c_day:"יום",
    o_all:"הכול", s_layers:"שכבות", l_st:"תחנות הידרומטריות", l_res:"סכרים ומאגרים",
    l_nm:"שמות נחלים", l_an:"ספיקה מול הרגיל", s_search:"חיפוש במפה", s_about:"אודות",
    b_about:"על הנתונים", s_leg:"ספיקה",
    legnote:"הצבע והעובי מציגים ספיקה (מ״ק/שנייה, סולם לוגריתמי). רק זרימה מגובה בראיות נעה: קו סגול מקווקו הוא טענת מודל שדבר אינו תומך בה, וקו מנוקד הוא היעדר נתונים. מאגרים מצוירים כמתאר בלבד, כי המפה אינה יודעת מה יש בהם היום.",
    b_h:"בונים את רשת הנחלים של ישראל",
    b_p:"מושכים את נחלי ישראל מרשות המים, ואז שואלים את מודל השיטפונות GloFAS כמה מים זורמים בהם היום. זה קורה פעם אחת — לאחר מכן הנתונים נשמרים בדפדפן.",
    ph:"נחל הירקון…",
    reaches:"קטעי נחל", modelled:"עם ספיקה מודלית", flowing:"זורמים היום", gauges:"תחנות מדידה", asof:"מוצג", dunit:"ימים",
    drag:"גררו לחקירה", hover:"רחפו מעל נחל", click:"לחצו לפרטים",
    unknown:"אין נתון מודל", dry:"יבש \u2014 אין זרימה", under:"מתחת ל־", over:"מעל",
    modelPill:"מודל", measPill:"מדוד",
    today:"היום", q_now:"ספיקה מודלית", basin:"אגן ניקוז", type:"סוג",
    river:"נחל איתן", stream:"נחל / ואדי", canal:"תעלה", intermittent:"אכזב",
    perennial:"איתן", vsnorm:"ביחס לרגיל לתאריך זה", pct:"אחוזון",
    computing:"מחשב…", nodata:"אין נתונים", length:"אורך",
    st_area:"שטח היקוות", st_rec:"תקופת מדידה", st_years:"שנים", st_vol:"נפח שנתי ממוצע",
    st_max:"ספיקת שיא שנמדדה", st_on:"בתאריך", st_status:"תחנה פעילה", st_id:"תחנה",
    fc:"תחזית ל־7 ימים", past:"7 הימים האחרונים",
    much_below:"הרבה מתחת לרגיל", below:"מתחת לרגיל",
    normal:"סביב הרגיל", above:"מעל הרגיל", much_above:"הרבה מעל הרגיל",
    s_base:"מפת רקע", b_base:"החלפת מפת רקע",
    bm_dark:"כהה", bm_labels:"שמות מקומות", bm_hill:"גובה \u2014 הצללת תבליט",
    bm_topo:"טופוגרפית \u2014 קווי גובה", bm_sat:"לוויין",
    bm_hint:"הצללת התבליט מבליטה את בקע הירדן ואת הנגב, וכך ברור לאן המים זורמים.",
    l_samp:"נקודות דיגום זיהום", l_bord:"גבולות ישראל", l_cross:"מעברי מים בגבול ישראל",
    crossing:"חוצה את גבול ישראל", cross_of:"חציית",
    b_int:"גבול בין־לאומי", b_indef:"גבול לא מסומן",
    b_disp:"גבול שנוי במחלוקת", b_loc:"קו הפרדה", b_arm:"קו שביתת נשק",
    rel:"מהימנות", rel_own:"קריאה מתא המודל", rel_fill:"הושלם מפרופיל הנחל",
    rel_low:"מקוטע מכדי להציג", rel_note:"הזרימה מוחלקת לאורך כל נחל כדי שרשת מודל גסה לא תגרום לו להיעצר ולחזור.",
    inflow:"נכנס מ", outflow:"יוצא אל",
    sampling:"נקודת דיגום זיהום בנחל", samp_of:"בנחל",
    elev_from:"גובה", elev_drop:"מפל", elev_grad:"שיפוע",
    src_official:"רשות המים", src_osm:"OpenStreetMap", src_net:"רשת הנחלים הלאומית",
    src_gapfill:"המקטע הזה חסר בשכבת רשות המים והושלם מרשת הנחלים הלאומית של ישראל.",
    segs:"מקטעים", wholeriver:"הנחל כולו",
    cache:"בניה מחדש של המטמון", err:"לא הצלחנו לטעון את רשת הנחלים.",
    errhint:"שרתי Overpass הציבוריים מגבילים בקשות כבדות, ולכן זו בדרך כלל תקלה זמנית \u2014 המתינו דקה ונסו שוב. אפשר גם לפתוח את המפה בלי נחלים: תחנות המדידה ומפת הרקע יעבדו.",
    without:"המשך בלי נחלים",
    partial:"ההשלמה מ־OpenStreetMap חלקית \u2014 %n מתוך %t אזורים לא נטענו.",
    retry:"נסו שוב", noresult:"לא נמצא",
    home:"חזרה לישראל",
    ev:"ראיות", ev_rain:"גשם על התא הזה", ev_rain_days:"ב־%n ימים",
    reg:"משטר זרימה, מדוד", reg_gauge:"לפי התחנה ב",
    reg_P:"איתן \u2014 זורם כל השנה", reg_N:"כמעט איתן \u2014 רוב השנה",
    reg_S:"עונתי \u2014 בעונת הגשמים בלבד", reg_R:"נדיר \u2014 זורם אחת לכמה שנים",
    reg_U:"תקופת המדידה קצרה מכדי לסווג", reg_none:"אין תחנה על הנחל הזה",
    reg_sum:"%p מימי הקיץ נשאו מים, %y שנות מדידה",
    reg_yrs:"מים ב־%f מהשנים, %y שנות מדידה",
    reg_far:"התחנה הקרובה ביותר על הנחל הזה מרוחקת %d ק״מ, ולכן זו התאמה לפי שם הנחל ולא לקטע הזה",
    au_rivers:"נחלים בעלי שם על המפה", au_frag:"עדיין מצוירים ביותר מחתיכה אחת",
    au_broken:"משנים מצב מצויר יותר מפעמיים לאורכם",
    au_filled:"מקטעים שהושלמו מהרשת הלאומית",
    au_worst:"השבורים ביותר", au_row:"%p חתיכות, %b שינויי מצב, פער מרבי %g ק״מ",
    au_note:"נספר בכל טעינה. נחל ביותר מחתיכה אחת הוא בדרך כלל חור במקור שהרשת הלאומית לא הצליחה להשלים; שינויי מצב לאורך נחל אחד הם המפה חלוקה על עצמה, וזה אמור להיות נדיר.",
    gap_working:"משלימים חורים ברשת הממופה \u2014 %p%, %r",
    gap_done:"הושלמו %n נחלים שהשכבה הרשמית משאירה חסרים, %s מקטעים חדשים, מרשת הנחלים הלאומית.",
    close:"סגירה",
    g_water:"מים", g_measure:"מדידה", g_context:"הקשר", g_marks:"תוויות וניתוח",
    bs_basin:"אגן היקוות", bs_catchrain:"גשם על אגן ההיקוות",
    bs_over:"התא הרטוב ביותר מתוך %n אגנים, %c תאים",
    bs_note:"אגני ניקוז מה־GIS הלאומי. הגשם נלקח כתא הרטוב ביותר בכל אגן ההיקוות של הנחל, כולל אגנים שנשפכים אליו — השאלה היא אם בכלל ייתכנו מים, לא כמה.",
    l_radar:"מכ״ם מזג אוויר \u2014 חי", ev_radar:"מכ״ם, עכשיו",
    ev_radar_wet:"גשם מעל אגן ההיקוות", ev_radar_dry:"אין הד",
    ev_why_radar:"מכ״ם מזג האוויר מראה גשם מעל אגן ההיקוות הזה ברגע זה. זו תצפית ולא מודל, וזו הראיה החזקה ביותר שיש למפה.",
    ev_why_radarup:"המכ״ם מראה גשם במעלה הזרם ברגע זה. המים ממנו מגיעים למקטע הזה.",
    radar_note:"תצלים של RainViewer, האחרון מבין שלושה־עשר פריימים המכסים את השעתיים האחרונות. ראיית מכ״ם תקפה להיום בלבד.",
    ev_why_rain:"ירד גשם על אגן ההיקוות הזה ב־%n הימים האחרונים, ולכן למים של המודל יש מהיכן להגיע.",
    ev_why_carried:"הקטע הזה נמצא מתחת למקטע שזורם. מים אינם נעצרים ומתחילים מחדש באותו אפיק, ולכן הזרימה נישאת לכאן ולא נשפטת שוב לפי התא של הקטע.",
    ev_rain_up:"במעלה הנחל; %c מ״מ בתא של הקטע עצמו",
    ev_trans:"כאן הנחל משנה מצב", l_trans:"נקודת שינוי במצב הנחל",
    sp_layer:"מעיינות \u2014 מדוד", sp_mean:"ספיקה ממוצעת", sp_summer:"ממוצע קיץ (יולי\u2013ספטמבר)",
    sp_last:"מדידה אחרונה", sp_wet:"מדידות שמצאו מים", sp_n:"מדידות",
    sp_reg:"נמדד באופן סדיר", sp_survey:"מעיין סקר", sp_old:"אינו נמדד עוד", sp_unk:"ללא פירוט",
    sp_feeds:"מקור המזין את הקטע",
    sp_note:"מרשם המעיינות והספיקות המדודות של השירות ההידרולוגי, דרך data.gov.il. ליטר לשנייה, מצטבר מכל מדידה שנרשמה במעיין הזה.",
    ev_why_spring:"לא ירד גשם, אבל %s מזרים כ־%v ליטר בשנייה לאפיק הזה, כאן או במעלה הזרם. נחל שמתחת למקור חי זורם גם בלי גשם.",
    tr_open:"מעקב אחרי הנחל, קטע אחר קטע", tr_unnamed:"נחל ללא שם",
    tr_lede:"כל מספר שהמפה השתמשה בו, לפי סדר זרימת המים. קו מקווקו הוא שבר בנתוני המקור.",
    tr_fetch:"שואלים את רשת הנחלים הלאומית על הנחל הזה\u2026",
    tr_acc:"רשת במעלה", tr_net:"רשת הנחלים הלאומית רואה בנחל הזה אפיק אחד רציף, סדר שטראלר %o. המספר שלמטה הוא אורך הרשת המצטבר במעלה \u2014 האורך הכולל של כל מה שמתנקז לכל נקודה, %k ק״מ במוצא. הוא עולה בעקביות במורד, וזה מה שהופך אותו לסדר מדוד ולא מוסק מהתבליט.",
    tr_nonet:"לרשת הנחלים הלאומית אין שדרה לנחל הזה, ולכן הסדר שלו נגזר מגובה תא המודל \u2014 קירוב בלבד.",
    tr_mouth_ok:"הקו המצויר שלנו מגיע למוצא הזה.",
    tr_mouth_gap:"הקו המצויר שלנו נעצר %d ק״מ לפני המוצא \u2014 החלק החסר אינו קיים במקורות שמהם המפה מציירת.",
    tr_pieces:"חלקים שאליהם נחתך", tr_maxgap:"הפער הגדול ביותר", tr_coast:"מהקצה עד קו החוף",
    tr_nodata:"קטעים ללא ערך מודל",
    tr_short:"הקו המצויר נעצר %d ק״מ מקו החוף, בגובה שמעיד שאמור להיות כאן מוצא. החלק החסר אינו קיים בשכבת רשות המים ולא הושלם מ־OpenStreetMap \u2014 המפה נגמרת היכן שהמקורות שלה נגמרים, ואינה מציירת אפיק שאין לה ראיה לקיומו.",
    tr_split:"הנחל הזה הגיע כ־%n חלקים מנותקים, כשהפער הגדול ביותר הוא %g ק״מ. חלקים המרוחקים יותר מ־3 ק״מ נשפטים בנפרד, כי שם משותף אינו הוכחה ששני אפיקים הם אותו נחל.",
    tr_gap:"שבר בנתוני המקור \u2014 %g ק״מ ללא אפיק ממופה",
    ev_why_perennial:"לא ירד גשם, אבל הנחל הזה נשא מים ב־80% ומעלה מימי הקיץ ברישומי השירות ההידרולוגי. נחל איתן זורם גם בלי גשם, ולכן המודל מתקבל כאן.",
    ev_why_rare:"המודל מדווח על מים, לא ירד גשם, ורישומי התחנה מראים שהאפיק הזה נושא מים בפחות מ־60% מהשנים. המדידה גוברת על המודל: המפה מציגה יבש.",
    ev_why_seasonal:"המודל מדווח על מים, לא ירד גשם, ורישומי התחנה מראים שהאפיק הזה זורם בעונת הגשמים בלבד. המדידה גוברת על המודל: המפה מציגה יבש.",
    ev_why_nearperennial:"הנחל הזה זורם ברוב השנה אך לא לאורך הקיץ, ולא ירד גשם. אף טענה אינה נתמכת, ולכן המפה אינה טוענת דבר.",
    cmp:"המודל מול הרישום המדוד", cmp_matched:"קטעים שהותאמו לנחל עם תחנת מדידה",
    cmp_over:"המודל טוען שיש מים במקום שהרישום אומר יבש",
    cmp_under:"המודל טוען יבש בנחל שזורם כל השנה",
    cmp_none:"אין סתירות ביום הזה.",
    cmp_note:"נספר מחדש בכל טעינה, ולא נטען פעם אחת. כל שורה מציינת את התחנה שמולה נשפט.",
    ev_flow:"מודל, מגובה בגשם", ev_dry:"יבש \u2014 המודל והגשם מסכימים",
    ev_stopped:"יבש \u2014 לא ירד גשם, אפיק אכזב",
    ev_unver:"לא מאומת", ev_none:"אין ערך מודל",
    ev_model_says:"המודל אומר",
    ev_nocheck_why:"בדיקת הגשם לא הצליחה לרוץ עבור התא הזה, ולכן שום דבר כאן אינו מגובה \u2014 זהו המודל לבדו. אין בכך אמירה שהאפיק יבש.",
    ev_unver_why:"המודל מדווח על מים כאן, אבל לא ירד גשם על התא הזה ואין לנו אינדיקציה שהאפיק זורם כל השנה. לכן המפה אינה טוענת שיש כאן זרימה, וגם אינה טוענת שיבש.",
    ev_stopped_why:"המודל מדווח על מים, לא ירד גשם על התא הזה, ו־OpenStreetMap ממפה את האפיק הזה כאכזב. בישראל זה אומר יבש, ולכן המפה מציגה יבש וגוברת על המודל.",
    l_basin:"מאגר \u2014 התוכן לא ידוע",
    w_body:"גוף מים", w_kind:"ממופה כ", w_area:"שטח", w_tags:"תגיות OSM",
    w_lake:"אגם טבעי", w_saltlake:"אגם מלח", w_reservoir:"מאגר", w_basin:"בריכה טכנית",
    w_unspecified:"מים, ללא סוג ב־OSM",
    w_seasonal:"מים עונתיים", w_saltpond:"בריכת אידוי", w_pond:"בריכה",
    w_unknown:"מים, ללא פירוט",
    w_wet:"קבוע \u2014 מצויר כמים",
    w_dry:"המפה אינה יודעת אם יש בו מים היום, ולכן הוא מצויר כמתאר בלבד ולא כמים. רוב המאגרים בישראל עומדים ריקים לאורך הקיץ.",
    w_src:"המתאר מ־OpenStreetMap. לא נבדק מול צילומי לוויין.",
    ver:"אימות", ver_run:"הרצת בדיקה מול רשת התחנות",
    ver_running:"בודקים את המודל מול %n תחנות…",
    ver_again:"הרצה נוספת", ver_when:"הרצה אחרונה",
    ver_model:"מודל, ממוצע 10 שנים", ver_meas:"מדוד, ממוצע שנתי",
    ver_ratio:"מודל \u00f7 מדוד", ver_n:"תחנות שהושוו",
    ver_w2:"בתוך פי 2", ver_w3:"בתוך פי 3",
    ver_rho:"מתאם דירוגים בין התחנות",
    ver_seas:"זרימת סוף הקיץ כשיעור מהחורף, לפי המודל",
    ver_dry:"תאי מודל שמוגדרים יבשים בסוף הקיץ",
    ver_bias:"הטיה חציונית", ver_over:"המודל גבוה מדי", ver_under:"המודל נמוך מדי",
    ver_fail:"לא הצלחנו להגיע לארכיון המודל \u2014 נסו שוב בעוד דקה.",
    ver_none:"טרם נבדק.",
    ver_worst:"הפער הגדול ביותר", ver_best:"הקרוב ביותר",
    ver_baked:"מגיע עם המפה, חושב בתאריך", ver_live:"הורץ בדפדפן הזה",
    ver_slow:"הרצה חיה נמשכת כשלוש־עשרה דקות: ארכיון המודל מוגבל בקצב בשכבה החינמית, ולכן הבדיקה מתקדמת בארבע תחנות לדקה.",
    ver_years:"שנות אנליזה־מחדש",
    v_mag_good:"המודל קולע בערך לגודל של נחל ישראלי.",
    v_mag_ok:"המודל קולע לגודל של נחל ישראלי בערך במחצית מהמקרים.",
    v_mag_poor:"המודל אינו תחליף למד: ברוב הנחלים המספר שלו שגוי ביותר מפי שלושה.",
    v_rank_good:"הוא מדרג את הרשת היטב — נחלים גדולים נקראים כגדולים.",
    v_rank_ok:"הוא מדרג את הרשת סבירה — נחלים גדולים בדרך כלל נקראים כגדולים, וזו בדיוק הדרישה מסולם הצבעים.",
    v_rank_poor:"הוא אפילו אינו מדרג את הרשת באופן אמין, ולכן יש לקרוא את הצבעים כרמז בלבד.",
    v_bias_high:"הוא נוטה כלפי מעלה, בערך פי %x בחציון.",
    v_bias_low:"הוא נוטה כלפי מטה, בערך פי %x בחציון.",
    v_bias_ok:"אין בו הטיה כוללת משמעותית.",
    v_dry:"נקודת התורפה שלו היא הקיץ: הוא מייבש רק %p מתאי התחנות באוגוסט ובספטמבר, ומחזיק את זרימת סוף הקיץ על %s מהחורף, בעוד שרוב הוואדיות בישראל פשוט נעצרים. יש להתייחס לקו כחול בסוף הקיץ בחשד, אלא אם הנחל מוזן ממעיינות או נושא קולחין — שכבת ״ספיקה מול הרגיל״ היא הדרך הכנה לקרוא את העונה הזו, כי אחוזון מנטרל את זרימת הבסיס הקבועה של המודל.",
    ver_note:"הנפח השנתי הממוצע שנמדד בכל תחנה, מומר למ״ק/שנייה, מול הממוצע של המודל באותן קואורדינטות. תקופות שונות ותא של 5 ק״מ מול חתך מדידה: הבדיקה בוחנת סדר גודל ודירוג, וזו בדיוק הטענה של המפה."
  }
};
let LANG = localStorage.getItem("rfil_lang");
if (LANG !== "he" && LANG !== "en") LANG = (navigator.language||"").toLowerCase().startsWith("he") ? "he" : "en";
const T = k => (I18N[LANG] && I18N[LANG][k]) || I18N.en[k] || k;

/* ---------- discharge scale ----------
   Israel is a dry country: its watercourses run one to three orders of
   magnitude smaller than the American rivers this map is modelled on, so the
   class breaks are set to local hydrology instead of copied from the US map.
   The map can sit on a dark or a light basemap, so the blue ramp is stepped
   twice from the same hue — each set validated against its own surface,
   never an automatic flip. */
const BINS = [0.05, 0.5, 2, 20];
/* Below ten litres a second a wadi is a damp bed, not a running stream, and
   arid GloFAS cells idle at a token non-zero baseflow. Calling that "flowing"
   is the single easiest way for this map to mislead, so it does not. */
const DRY_Q = 0.01;
const RAMP = {
  dark:  { cols:["#184f95","#2a78d6","#6da7ec","#9ec5f4","#cde2fb"],
           dry:"#a88a4a", unver:"#ab77cd", unknown:"#5d6a73",
           label:"#cfd9e1", halo:"rgba(13,15,17,.85)",
           water:"rgba(24,79,149,.42)", waterEdge:"rgba(109,167,236,.5)",
           dryWater:"rgba(168,138,74,.10)", dryWaterEdge:"rgba(168,138,74,.75)",
           dam:"#c9d3db", border:"#7b8892", cross:"#fab219" },
  light: { cols:["#86b6ef","#5598e7","#2a78d6","#184f95","#0d366b"],
           dry:"#7d6428", unver:"#8f3fbe", unknown:"#727f86",
           label:"#1b2a33", halo:"rgba(255,255,255,.9)",
           water:"rgba(37,106,191,.35)", waterEdge:"rgba(24,79,149,.65)",
           dryWater:"rgba(125,100,40,.10)", dryWaterEdge:"rgba(125,100,40,.8)",
           dam:"#33414c", border:"#4b5762", cross:"#b8770a" }
};
let SURF = "dark";
const pal = () => RAMP[SURF];
/* 0 = no model value, 1 = dry, 2..6 = the five discharge bins,
   7 = the model says water and nothing corroborates it */
const CLS_UNKNOWN = 0, CLS_DRY = 1, CLS_QLO = 2, CLS_QHI = 6, CLS_UNVER = 7;
const classOf = q => {
  if (q == null || !isFinite(q)) return CLS_UNKNOWN;
  if (q < DRY_Q) return CLS_DRY;
  for (let i = 0; i < BINS.length; i++) if (q < BINS[i]) return i + 2;
  return CLS_QHI;
};
const NCLASS = 8;
const classCol = c => c === CLS_UNKNOWN ? pal().unknown
                    : c === CLS_DRY     ? pal().dry
                    : c === CLS_UNVER   ? pal().unver
                    : pal().cols[c-2];
/* Colour is never the only signal: each non-flowing state has its own stroke.
   [] solid = dry bed · short dash = unverified · dotted = no data at all. */
const classDash = c => c === CLS_UNVER ? [5, 5] : c === CLS_UNKNOWN ? [1.5, 4] : [];
const colOf = q => classCol(classOf(q));
const widOf = (q,z) => {
  const base = Math.max(1.25, (z-6)*0.5);
  if (q == null || !isFinite(q)) return base*0.66;
  return base * (0.72 + 0.74*Math.log10(1 + Math.max(q,0)*22));
};
const fmtQ = q => (q==null || !isFinite(q)) ? "\u2014"
  : q>=100 ? q.toFixed(0) : q>=10 ? q.toFixed(1) : q>=1 ? q.toFixed(2) : q.toFixed(3);
const fmtN = n => n==null ? "\u2014" : n.toLocaleString(LANG==="he"?"he-IL":"en-GB");

/* ---------- scope ----------
   One object decides what this map is about. Today it is Israel: the
   official stream layer plus, on the far side of each border, only the
   watercourses that actually cross into or out of it.

   To grow the map — a neighbour, or the whole Middle East — you change
   this object, not the rest of the code:

     · fetchBox      the region asked of Overpass, S,W,N,E
     · home          how "inside" is decided: the polygon rings baked into
                     EXTENT, and the footprint of the authoritative layer
     · foreignPolicy "crossing-only" keeps a foreign reach only if it
                     crosses home's border or joins one that does;
                     "all" keeps everything inside fetchBox
     · borderPairs   null = draw every boundary in BORDERS; otherwise a
                     list of "A|B" pairs to keep
     · view          opening centre and zoom, and the button that returns
                     to it

   A Middle East build is then roughly:
     fetchBox: [12, 25, 42, 60], foreignPolicy: "all", borderPairs: null,
     home: { rings: [], official: true }, and a wider view.
*/
const SCOPE = {
  id: "israel",
  fetchBox: [28.90, 33.60, 34.05, 36.70],       /* S, W, N, E */
  home: { rings: (typeof EXTENT !== "undefined" ? EXTENT : []), official: true,
          nearKm: 2 },
  foreignPolicy: "crossing-only",
  borderPairs: null,
  view: { center: [31.45, 34.95], zoom: 8, min: 3, max: 18 }
};
const BBOX = SCOPE.fetchBox;
const CENTER = SCOPE.view.center, ZOOM = SCOPE.view.zoom;
const SEP = String.fromCharCode(1);

/* ---------- tiny IndexedDB wrapper ---------- */
const DB_NAME = "riverflow_il", STORE = "cache", DB_VER = 1;
function idb(){
  return new Promise((res,rej)=>{
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = () => { const d = r.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  });
}
async function cacheGet(k){
  try{ const d = await idb();
    return await new Promise((res,rej)=>{
      const q = d.transaction(STORE).objectStore(STORE).get(k);
      q.onsuccess = ()=>res(q.result); q.onerror = ()=>rej(q.error); });
  }catch(e){ return undefined; }
}
async function cacheSet(k,v){
  try{ const d = await idb();
    await new Promise((res,rej)=>{
      const t = d.transaction(STORE,"readwrite");
      t.objectStore(STORE).put(v,k);
      t.oncomplete = ()=>res(); t.onerror = ()=>rej(t.error); });
  }catch(e){}
}
async function cacheClear(){
  try{ const d = await idb();
    await new Promise(res=>{ const t = d.transaction(STORE,"readwrite");
      t.objectStore(STORE).clear(); t.oncomplete = res; });
  }catch(e){}
}

/* ---------- geometry ---------- */
function rdp(pts, eps){
  if (pts.length < 3) return pts;
  const x1 = pts[0][0], y1 = pts[0][1];
  const x2 = pts[pts.length-1][0], y2 = pts[pts.length-1][1];
  let idx = -1, dmax = 0;
  const dx = x2-x1, dy = y2-y1, den = Math.hypot(dx,dy) || 1e-12;
  for (let i=1;i<pts.length-1;i++){
    const d = Math.abs(dy*pts[i][0] - dx*pts[i][1] + x2*y1 - y2*x1) / den;
    if (d > dmax){ dmax = d; idx = i; }
  }
  if (dmax > eps){
    const a = rdp(pts.slice(0,idx+1), eps), b = rdp(pts.slice(idx), eps);
    return a.slice(0,-1).concat(b);
  }
  return [pts[0], pts[pts.length-1]];
}
/* RDP on a closed ring collapses to two points because the first and last
   point coincide, so split the ring in half and simplify each arc. */
function rdpRing(pts, eps){
  let r = pts.slice();
  if (r.length > 2 && r[0][0] === r[r.length-1][0] && r[0][1] === r[r.length-1][1]) r.pop();
  if (r.length < 4) return pts;
  const h = Math.floor(r.length/2);
  const a = rdp(r.slice(0, h+1), eps);
  const b = rdp(r.slice(h).concat([r[0]]), eps);
  const out = a.concat(b.slice(1));
  return out.length >= 4 ? out : r.concat([r[0]]);
}

/* shoelace area in square kilometres, good enough at these latitudes */
function areaKm2(g){
  let s = 0;
  for (let i = 0, j = g.length-1; i < g.length; j = i++)
    s += (g[j][0]*g[i][1] - g[i][0]*g[j][1]);
  const midLat = g[0][1] * Math.PI/180;
  return Math.abs(s/2) * 111.32 * 111.32 * Math.cos(midLat);
}

function lenKm(g){
  let s = 0;
  for (let i=1;i<g.length;i++){
    const dx = (g[i][0]-g[i-1][0])*93.5, dy = (g[i][1]-g[i-1][1])*111.3;
    s += Math.hypot(dx,dy);
  }
  return s;
}

/* ---------- Overpass ----------
   The whole region in one request is a ~40 MB response that the public
   instances routinely refuse or time out on, and a single failure used to
   leave the map with nothing. So: several mirrors in rotation, the region cut
   into horizontal bands, retries with backoff, and partial results kept. */
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.osm.jp/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
];
let epIdx = 0;
let lastOverpassError = "";
const badEp = new Set();   /* mirrors that hung or refused; skipped for this session */
function nextEp(){
  for (let i = 0; i < OVERPASS.length; i++){
    const ep = OVERPASS[(epIdx + i) % OVERPASS.length];
    if (!badEp.has(ep)){ epIdx = (epIdx + i + 1) % OVERPASS.length; return ep; }
  }
  badEp.clear();                       /* everything is sulking — start over */
  return OVERPASS[epIdx++ % OVERPASS.length];
}
const napms = ms => new Promise(r => setTimeout(r, ms));

/* A mirror that accepts the connection and then never answers would otherwise
   hang the loader forever, so every request carries its own deadline. */
function fetchWithTimeout(url, opts, ms){
  if (typeof AbortController === "undefined") return fetch(url, opts);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  const o = Object.assign({}, opts, { signal: ac.signal });
  return fetch(url, o).finally(() => clearTimeout(t));
}

async function overpass(query, attempts){
  const tries = attempts || OVERPASS.length;
  let lastErr = "";
  for (let t = 0; t < tries; t++){
    const ep = nextEp();
    try{
      const r = await fetchWithTimeout(ep, { method:"POST",
        headers:{ "Content-Type":"application/x-www-form-urlencoded" },
        body:"data=" + encodeURIComponent(query) }, 45000);
      if (r.status === 429 || r.status === 504 || r.status === 503){
        lastErr = host(ep) + " busy (" + r.status + ")";
        await napms(900 + t * 500);
        continue;
      }
      if (!r.ok){ lastErr = host(ep) + " HTTP " + r.status; continue; }
      const txt = await r.text();
      let j;
      try{ j = JSON.parse(txt); }
      catch(e){ lastErr = host(ep) + " sent a non-JSON reply"; continue; }
      /* Overpass reports runtime failures as HTTP 200 with a remark. */
      if (j.remark && (!j.elements || !j.elements.length)){
        lastErr = host(ep) + ": " + String(j.remark).slice(0, 90);
        await napms(900);
        continue;
      }
      return j;
    }catch(e){
      const timedOut = e && e.name === "AbortError";
      lastErr = host(ep) + (timedOut ? " timed out" : " unreachable");
      badEp.add(ep);
      await napms(400 + t * 250);
    }
  }
  lastOverpassError = lastErr;
  throw new Error(lastErr || "no Overpass mirror answered");
}
function host(u){ try{ return new URL(u).host; }catch(e){ return u; } }

/* horizontal bands, small enough that each one is a quick request */
function bands(n){
  const s = BBOX[0], w = BBOX[1], nn = BBOX[2], e = BBOX[3];
  const out = [];
  for (let i = 0; i < n; i++)
    out.push([ s + (nn-s)*i/n, w, s + (nn-s)*(i+1)/n, e ].map(v => +v.toFixed(4)).join(","));
  return out;
}
const RIVER_BANDS = bands(8);
const WATER_BANDS = bands(4);

const qRivers = bb => '[out:json][timeout:120];\n' +
  '(way["waterway"="river"](' + bb + ');\n' +
  ' way["waterway"="stream"]["name"](' + bb + ');\n' +
  ' way["waterway"="canal"]["name"](' + bb + '););\nout geom;';
const qWater = bb => '[out:json][timeout:120];\n' +
  '(way["natural"="water"]["water"~"^(reservoir|lake|pond|basin)$"](' + bb + ');\n' +
  ' way["landuse"="reservoir"](' + bb + ');\n' +
  ' rel["natural"="water"]["water"~"^(reservoir|lake)$"](' + bb + ');\n' +
  ' way["waterway"="dam"](' + bb + ');\n' +
  ' node["waterway"="dam"](' + bb + '););\nout geom;';

/* OSM draws waterways in the direction of flow, so point order is downstream.
   Ways that share a name and touch end-to-end are merged into one reach. */
function buildReaches(osm){
  const els = (osm.elements||[]).filter(e => e.geometry && e.geometry.length > 1);
  const byKey = new Map();
  for (const e of els){
    const t = e.tags || {};
    const wt = t.waterway === "river" ? 0 : t.waterway === "stream" ? 1 : 2;
    const key = [t["name:he"]||t.name||"", t["name:en"]||"", wt, t.intermittent==="yes"?1:0].join(SEP);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push({ id:e.id, g:e.geometry.map(p=>[p.lon,p.lat]) });
  }
  const key5 = p => p[0].toFixed(6) + "," + p[1].toFixed(6);
  const out = [];
  for (const entry of byKey){
    const parts = entry[0].split(SEP), arr = entry[1];
    const nameHe = parts[0], nameEn = parts[1], wt = +parts[2], it = +parts[3];
    const head = new Map();
    for (const w of arr){
      const h = key5(w.g[0]);
      if (!head.has(h)) head.set(h, []);
      head.get(h).push(w);
    }
    const used = new Set(), chains = [];
    for (const w of arr){
      if (used.has(w.id)) continue;
      const sh = key5(w.g[0]);
      if (arr.some(o => o !== w && !used.has(o.id) && key5(o.g[o.g.length-1]) === sh)) continue;
      used.add(w.id);
      let chain = w.g.slice();
      for(;;){
        const tail = key5(chain[chain.length-1]);
        const c = (head.get(tail) || []).filter(o => !used.has(o.id));
        if (c.length !== 1) break;
        used.add(c[0].id);
        chain = chain.concat(c[0].g.slice(1));
      }
      chains.push(chain);
    }
    for (const w of arr) if (!used.has(w.id)){ used.add(w.id); chains.push(w.g.slice()); }
    for (const chain of chains){
      const g = rdp(chain, wt === 0 ? 0.00035 : 0.0007);
      if (g.length < 2) continue;
      out.push({ he:nameHe, en:nameEn, wt:wt, it:it, g:g, km:+lenKm(g).toFixed(2) });
    }
  }
  out.sort((a,b) => (a.wt - b.wt) || (b.km - a.km));
  return out;
}

/* ---------- what a water polygon actually is ----------
   OpenStreetMap draws the outline of a basin. It does not say whether
   there is water in it today, and in Israel that distinction is most of
   the answer: the great majority of these polygons are agricultural
   reservoirs, winter-fill basins, evaporation and sewage ponds and fish
   ponds, which stand empty for months. Painting them all the same blue
   is how this map ended up showing lakes in the desert.

   So each polygon is classified from its own tags, and only a natural,
   permanent, non-seasonal lake is filled. Everything else is drawn as an
   outline: the shape is real, the water is not asserted. */
/* Checked against the live data, over the Galilee, the Jordan Valley and the
   Dead Sea: of 2,611 water polygons there, only 34 carry an explicit
   water=lake. 1,148 are bare natural=water with no subtype at all — and their
   own names give them away: Ma'agar Bazelet, Ma'agar Yaqutza, Ma'agar Ammud.
   Reservoirs, every one, and the earlier version of this map painted all of
   them lake-blue. A bare natural=water is therefore treated as unspecified
   and drawn as an outline: OSM has not said there is water in it, so neither
   does this map.

   The name is evidence too, and OSM supplies it: ma'agar is a reservoir,
   brekhat a pool, malhat a salt flat. A polygon named one of those is not a
   lake however it is tagged. */
const NOT_LAKE_RE = /(^|[\s\-])(מאגר|בריכ|מלח|בְּרֵכ|reservoir|pond|pool|basin|salt\s?flat|settling|sewage)/i;
function waterKind(t){
  const nm = (t.name || "") + " " + (t["name:en"] || "") + " " + (t["name:he"] || "");
  if (t.intermittent === "yes" || t.seasonal === "yes") return "seasonal";
  if (t.landuse === "salt_pond" || t.water === "salt_pool") return "saltpond";
  if (t.landuse === "reservoir" || t.water === "reservoir") return "reservoir";
  if (t.water === "basin" || t.basin) return "basin";
  if (t.water === "pond" || t.landuse === "aquaculture") return "pond";
  if (t.water === "lake"){
    if (NOT_LAKE_RE.test(nm)) return "reservoir";     /* named a reservoir; believe the name */
    return t.salt === "yes" ? "saltlake" : "lake";    /* the Dead Sea is salt and permanent */
  }
  if (t.natural === "water") return "unspecified";    /* no subtype: OSM has not said */
  return "unknown";
}
/* the only kinds this map is willing to paint as water: a lake OSM has
   explicitly called a lake. In Israel that is a very short list, which is
   the honest length for it. */
const WATER_FILLED = { lake: 1, saltlake: 1 };

function buildWater(osm){
  const polys = [], dams = [];
  for (const e of (osm.elements||[])){
    const t = e.tags || {};
    if (t.waterway === "dam"){
      if (e.type === "node") dams.push({ lat:e.lat, lon:e.lon, he:t["name:he"]||t.name||"", en:t["name:en"]||"" });
      else if (e.geometry && e.geometry.length){
        const m = e.geometry[Math.floor(e.geometry.length/2)];
        dams.push({ lat:m.lat, lon:m.lon, he:t["name:he"]||t.name||"", en:t["name:en"]||"" });
      }
      continue;
    }
    const rings = [];
    if (e.type === "way" && e.geometry) rings.push(e.geometry.map(p=>[p.lon,p.lat]));
    else if (e.type === "relation" && e.members){
      for (const m of e.members)
        if (m.role !== "inner" && m.geometry && m.geometry.length > 2)
          rings.push(m.geometry.map(p=>[p.lon,p.lat]));
    }
    for (const r of rings){
      if (r.length < 4) continue;
      const g = rdpRing(r, 0.00035);
      if (g.length < 3) continue;
      const a = areaKm2(g);
      if (a < 0.004) continue;               /* skip farm ponds smaller than 4 dunam */
      const kind = waterKind(t);
      polys.push({ g:g, a:+a.toFixed(4), he:t["name:he"]||t.name||"", en:t["name:en"]||"",
                   k:kind, wet:WATER_FILLED[kind] ? 1 : 0,
                   /* the tags the classification rests on, so a reader can check it */
                   tg:[t.natural, t.water, t.landuse, t.intermittent && "intermittent=yes",
                       t.seasonal && "seasonal=yes", t.salt && "salt=yes"]
                      .filter(Boolean).join(" \u00b7 ") });
    }
  }
  return { polys:polys, dams:dams };
}

// Text to phonemes for the speech engine (speech.js).
//
// Letter to sound: the rules of H. S. Elovitz, R. Johnson, A. McHugh and J. E. Shore, "Automatic
// Translation of English Text to Phonetics by Means of Letter-to-Sound Rules", NRL Report 7948,
// Naval Research Laboratory, 1976 (a U.S. government work in the public domain), written out here
// in a compact form. A rule is left[match]right=output: the match is replaced by the output when the
// letters around it fit the contexts, the first fitting rule wins, and the text moves on past the
// match. In a context: a space is a word edge, # one or more vowels, : zero or more consonants,
// ^ one consonant, . a voiced consonant (B D V G J L M N R W Z), + a front vowel (E I Y), % a
// suffix (E, ER, ES, ED, ELY, ING), & a sibilant (S C G Z X J CH SH), @ a consonant before a
// long U (T S R D L Z N J TH CH SH). The output uses the report's own symbols: two capitals for a
// vowel and for TH DH SH ZH CH NG WH, one lower case letter for any other consonant (j is the J of
// judge).
// Around the rules, written for this engine: an exception lexicon for common words the rules get
// wrong and the words the voice sounds use, stress (the rules give none), numbers, letters of an
// acronym, and [ARPAbet] overrides typed into the text.

/**
 * English text to ARPAbet phonemes for speechPlan: vowels with stress digits, '/' between words,
 * punctuation kept as pauses. "Access denied." -> "AE1 K S EH2 S / D IH0 N AY1 D ."
 * [W EY1 T] in the text is used as it is (an override for one word).
 */
export function phonemize(text) {
  const Z = phonemize;
  if (!Z.r) {
    // ---- the NRL rules, in report order within each letter
    const R = ('[A] =AX| [ARE] =AAr| [AR]O=AXr|[AR]#=EHr|^[AS]#=EYs|[A]WA=AX|[AW]=AO| :[ANY]=EHnIY|[A]^+#=EY|#:[ALLY]=AXlIY|' +
      ' [AL]#=AXl|[AGAIN]=AXgEHn|#:[AG]E=IHj|[A]^+:#=AE| :[A]^+ =EY|[A]^%=EY| [ARR]=AXr|[ARR]=AEr| :[AR] =AAr|[AR] =ER|' +
      '[AR]=AAr|[AIR]=EHr|[AI]=EY|[AY]=EY|[AU]=AO|#:[AL] =AXl|#:[ALS] =AXlz|[ALK]=AOk|[AL]^=AOl| :[ABLE]=EYbAXl|' +
      '[ABLE]=AXbAXl|[ANG]+=EYnj|[A]=AE|' +
      ' [BE]^#=bIH|[BEING]=bIYIHNG| [BOTH] =bOWTH| [BUS]#=bIHz|[BUIL]=bIHl|[B]=b|' +
      ' [CH]^=k|^E[CH]=k|[CH]=CH| S[CI]#=sAY|[CI]A=SH|[CI]O=SH|[CI]EN=SH|[C]+=s|[CK]=k|[COM]%=kAHm|[C]=k|' +
      '#:[DED] =dIHd|.E[D] =d|#:^E[D] =t| [DE]^#=dIH| [DO] =dUW| [DOES]=dAHz| [DOING]=dUWIHNG| [DOW]=dAW|[DU]A=jUW|[D]=d|' +
      '#:[E] =|\'^:[E] =| :[E] =IY|#[ED] =d|#:[E]D =|[EV]ER=EHv|[E]^%=IY|[ERI]#=IYrIY|[ERI]=EHrIH|#:[ER]#=ER|[ER]#=EHr|' +
      '[ER]=ER| [EVEN]=IYvEHn|#:[E]W=|@[EW]=UW|[EW]=yUW|[E]O=IY|#:&[ES] =IHz|#:[E]S =|#:[ELY] =lIY|#:[EMENT]=mEHnt|' +
      '[EFUL]=fUHl|[EE]=IY|[EARN]=ERn| [EAR]^=ER|[EAD]=EHd|#:[EA] =IYAX|[EA]SU=EH|[EA]=IY|[EIGH]=EY|[EI]=IY| [EYE]=AY|' +
      '[EY]=IY|[EU]=yUW|[E]=EH|' +
      '[FUL]=fUHl|[F]=f|' +
      '[GIV]=gIHv| [G]I^=g|[GE]T=gEH|SU[GGES]=gjEHs|[GG]=g| B#[G]=g|[G]+=j|[GREAT]=grEYt|#[GH]=|[G]=g|' +
      ' [HAV]=hAEv| [HERE]=hIYr| [HOUR]=AWER|[HOW]=hAW|[H]#=h|[H]=|' +
      ' [IN]=IHn| [I] =AY|[IN]D=AYn|[IER]=IYER|#:R[IED]=IYd|[IED] =AYd|[IEN]=IYEHn|[IE]T=AYEH| :[I]%=AY|[I]%=IY|' +
      '[IE]=IY|[I]^+:#=IH|[IR]#=AYr|[IZ]%=AYz|[IS]%=AYz|[I]D%=AY|+^[I]^+=IH|[I]T%=AY|#:^[I]^+=IH|[I]^+=AY|[IR]=ER|' +
      '[IGH]=AY|[ILD]=AYld|[IGN] =AYn|[IGN]^=AYn|[IGN]%=AYn|[IQUE]=IYk|[I]=IH|' +
      '[J]=j| [K]N=|[K]=k|' +
      '[LO]C#=lOW|L[L]=|#:^[L]%=AXl|[LEAD]=lIYd|[L]=l|[MOV]=mUWv|[M]=m|' +
      'E[NG]+=nj|[NG]R=NGg|[NG]#=NGg|[NGL]%=NGgAXl|[NG]=NG|[NK]=NGk| [NOW] =nAW|[N]=n|' +
      '[OF] =AXv|[OROUGH]=EROW|#:[OR] =ER|#:[ORS] =ERz|[OR]=AOr| [ONE]=wAHn|[OW]=OW| [OVER]=OWvER|[OV]=AHv|[O]^%=OW|' +
      '[O]^EN=OW|[O]^I#=OW|[OL]D=OWl|[OUGHT]=AOt|[OUGH]=AHf| [OU]=AW|H[OUS]#=AWs|[OUS]=AXs|[OUR]=AOr|[OULD]=UHd|' +
      '^[OU]^L=AH|[OUP]=UWp|[OU]=AW|[OY]=OY|[OING]=OWIHNG|[OI]=OY|[OOR]=AOr|[OOK]=UHk|[OOD]=UHd|[OO]=UW|[O]E=OW|' +
      '[O] =OW|[OA]=OW| [ONLY]=OWnlIY| [ONCE]=wAHns|[ON\'T]=OWnt|C[O]N=AA|[O]NG=AO| :^[O]N=AH|I[ON]=AXn|#:[ON] =AXn|' +
      '#^[ON]=AXn|[O]ST =OW|[OF]^=AOf|[OTHER]=AHDHER|[OSS] =AOs|#:^[OM]=AHm|[O]=AA|' +
      '[PH]=f|[PEOP]=pIYp|[POW]=pAW|[PUT] =pUHt|[P]=p|[QUAR]=kwAOr|[QU]=kw|[Q]=k| [RE]^#=rIY|[R]=r|' +
      '[SH]=SH|#[SION]=ZHAXn|[SOME]=sAHm|#[SUR]#=ZHER|[SUR]#=SHER|#[SU]#=ZHUW|#[SSU]#=SHUW|#[SED] =zd|#[S]#=z|' +
      '[SAID]=sEHd|^[SION]=SHAXn|[S]S=|.[S] =z|#:.E[S] =z|#:^##[S] =z|#:^#[S] =s|U[S] =s| :#[S] =z| [SCH]=sk|[S]C+=|' +
      '#[SM]=zm|#[SN]\'=zAXn|[S]=s|' +
      ' [THE] =DHAX|[TO] =tUW|[THAT] =DHAEt| [THIS] =DHIHs| [THEY]=DHEY| [THERE]=DHEHr|[THER]=DHER|[THEIR]=DHEHr|' +
      ' [THAN] =DHAEn| [THEM] =DHEHm|[THESE] =DHIYz| [THEN]=DHEHn|[THROUGH]=THrUW|[THOSE]=DHOWz|[THOUGH] =DHOW|' +
      ' [THUS]=DHAHs|[TH]=TH|#:[TED] =tIHd|S[TI]#N=CH|[TI]O=SH|[TI]A=SH|[TIEN]=SHAXn|[TUR]#=CHER|[TU]A=CHUW|' +
      ' [TWO]=tUW|[T]=t|' +
      ' [UN]I=yUWn| [UN]=AHn| [UPON]=AXpAOn|@[UR]#=UHr|[UR]#=yUHr|[UR]=ER|[U]^ =AH|[U]^^=AH|[UY]=AY| G[U]#=|G[U]%=|' +
      'G[U]#=w|#N[U]=yUW|@[U]=UW|[U]=yUW|[VIEW]=vyUW|[V]=v|' +
      ' [WERE]=wER|[WA]S=wAA|[WA]T=wAA|[WHERE]=WHEHr|[WHAT]=WHAAt|[WHOL]=hOWl|[WHO]=hUW|[WH]=WH|[WAR]=wAOr|' +
      '[WOR]^=wER|[WR]=r|[W]=w|[X]=ks|' +
      '[YOUNG]=yAHNG| [YOU]=yUW| [YES]=yEHs| [Y]=y|#:^[Y] =IY|#:^[Y]I=IY| :[Y] =AY| :[Y]#=AY| :[Y]^+:#=IH| :[Y]^#=AY|' +
      '[Y]=IH|[Z]=z|' +
      '.[\'S]=z|#:.E[\'S]=z|#[\'S]=z|[\']=').split('|');
    Z.r = {};
    for (const s of R) {
      const m = /^(.*)\[(.+)\](.*)=(.*)$/.exec(s);
      (Z.r[m[2][0]] = Z.r[m[2][0]] || []).push([m[1], m[2], m[3], m[4]]);
    }
    // ---- the exception lexicon: word=ARPAbet. Function words are unstressed.
    const L = ('a=AX0|about=AX0 B AW1 T|above=AX0 B AH1 V|accepted=AE0 K S EH1 P T IH0 D|access=AE1 K S EH2 S|' +
      'across=AX0 K R AO1 S|adventure=AE0 D V EH1 N CH ER0|affirmative=AX0 F ER1 M AX0 T IH0 V|also=AO1 L S OW0|' +
      'always=AO1 L W EY2 Z|among=AX0 M AH1 NG|an=AE0 N|and=AE0 N D|another=AX0 N AH1 DH ER0|answer=AE1 N S ER0|' +
      'anything=EH1 N IY0 TH IH2 NG|are=AA0 R|arrive=AX0 R AY1 V|as=AE0 Z|at=AE0 T|attack=AX0 T AE1 K|' +
      'attention=AX0 T EH1 N SH AX0 N|be=B IY0|beautiful=B Y UW1 T AX0 F AX0 L|because=B IH0 K AH1 Z|' +
      'been=B IH1 N|beep=B IY1 P|billion=B IH1 L Y AX0 N|bonus=B OW1 N AX0 S|boop=B UW1 P|breach=B R IY1 CH|' +
      'break=B R EY1 K|breath=B R EH1 TH|brown=B R AW1 N|busy=B IH1 Z IY0|buy=B AY1|by=B AY0|bye=B AY1|' +
      'captain=K AE1 P T AX0 N|castle=K AE1 S AX0 L|city=S IH1 T IY0|clear=K L IH1 R|color=K AH1 L ER0|' +
      'command=K AX0 M AE1 N D|commander=K AX0 M AE1 N D ER0|complete=K AX0 M P L IY1 T|' +
      'compute=K AX0 M P Y UW1 T|computer=K AX0 M P Y UW1 T ER0|confirmed=K AX0 N F ER1 M D|' +
      'connect=K AX0 N EH1 K T|containment=K AX0 N T EY1 N M AX0 N T|control=K AX0 N T R OW1 L|cost=K AO1 S T|' +
      'country=K AH1 N T R IY0|crown=K R AW1 N|data=D EY1 T AX0|deactivated=D IY0 AE1 K T IH0 V EY2 T IH0 D|' +
      'death=D EH1 TH|denied=D IH0 N AY1 D|destruct=D IH0 S T R AH1 K T|different=D IH1 F R AX0 N T|' +
      'done=D AH1 N|easy=IY1 Z IY0|eighteen=EY1 T IY1 N|eighth=EY1 T TH|eleven=IH0 L EH1 V AX0 N|' +
      'enemy=EH1 N AX0 M IY0|energy=EH1 N ER0 JH IY0|engine=EH1 N JH AX0 N|enough=IH0 N AH1 F|error=EH1 R ER0|' +
      'escape=IH0 S K EY1 P|evacuate=IH0 V AE1 K Y UW0 EY2 T|every=EH1 V R IY0|everyone=EH1 V R IY0 W AH2 N|' +
      'everything=EH1 V R IY0 TH IH2 NG|example=IH0 G Z AE1 M P AX0 L|exit=EH1 G Z IH0 T|' +
      'explore=IH0 K S P L AO1 R|eye=AY1|eyes=AY1 Z|facility=F AX0 S IH1 L AX0 T IY0|father=F AA1 DH ER0|' +
      'fifteen=F IH1 F T IY1 N|five=F AY1 V|flower=F L AW1 ER0|food=F UW1 D|foot=F UH1 T|for=F AO0 R|' +
      'four=F AO1 R|fourteen=F AO1 R T IY1 N|friend=F R EH1 N D|friend\'s=F R EH1 N D Z|friends=F R EH1 N D Z|' +
      'from=F R AH0 M|game=G EY1 M|go=G OW1|goodbye=G UH2 D B AY1|granted=G R AE1 N T IH0 D|' +
      'greetings=G R IY1 T IH0 NG Z|had=HH AE0 D|half=HH AE1 F|has=HH AE0 Z|health=HH EH1 L TH|heart=HH AA1 R T|' +
      'heavy=HH EH1 V IY0|hello=HH AX0 L OW1|hero=HH IH1 R OW0|hey=HH EY1|hi=HH AY1|his=HH IH1 Z|' +
      'human=HH Y UW1 M AX0 N|humans=HH Y UW1 M AX0 N Z|hundred=HH AH1 N D R AX0 D|idea=AY0 D IY1 AX0|' +
      'identity=AY0 D EH1 N T AX0 T IY0|immediately=IH0 M IY1 D IY0 AX0 T L IY0|in=IH0 N|' +
      'initiated=IH0 N IH1 SH IY0 EY2 T IH0 D|invalid=IH0 N V AE1 L AX0 D|is=IH0 Z|island=AY1 L AX0 N D|' +
      'it=IH0 T|it\'s=IH1 T S|its=IH1 T S|journey=JH ER1 N IY0|laugh=L AE1 F|level=L EH1 V AX0 L|' +
      'listen=L IH1 S AX0 N|live=L IH1 V|lives=L AY1 V Z|loading=L OW1 D IH0 NG|lockdown=L AA1 K D AW2 N|' +
      'lose=L UW1 Z|lost=L AO1 S T|machine=M AX0 SH IY1 N|maybe=M EY1 B IY0|million=M IH1 L Y AX0 N|' +
      'minus=M AY1 N AX0 S|minute=M IH1 N AX0 T|mission=M IH1 SH AX0 N|monster=M AA1 N S T ER0|' +
      'mountain=M AW1 N T AX0 N|nature=N EY1 CH ER0|negative=N EH1 G AX0 T IH0 V|nineteen=N AY1 N T IY1 N|ninety=N AY1 N T IY0|' +
      'ninth=N AY1 N TH|nothing=N AH1 TH IH0 NG|ocean=OW1 SH AX0 N|of=AH0 V|offline=AO1 F L AY2 N|ok=OW2 K EY1|' +
      'okay=OW2 K EY1|one=W AH1 N|online=AA1 N L AY2 N|or=AO0 R|orange=AO1 R AX0 N JH|our=AW1 ER0|' +
      'over=OW1 V ER0|password=P AE1 S W ER2 D|percent=P ER0 S EH1 N T|personnel=P ER2 S AX0 N EH1 L|' +
      'piece=P IY1 S|planet=P L AE1 N AX0 T|player=P L EY1 ER0|please=P L IY1 Z|problem=P R AA1 B L AX0 M|' +
      'processing=P R AA1 S EH0 S IH0 NG|program=P R OW1 G R AE2 M|pull=P UH1 L|push=P UH1 SH|read=R IY1 D|' +
      'ready=R EH1 D IY0|really=R IH1 L IY0|remaining=R IH0 M EY1 N IH0 NG|request=R IH0 K W EH1 S T|' +
      'river=R IH1 V ER0|robot=R OW1 B AA2 T|robots=R OW1 B AA2 T S|says=S EH1 Z|search=S ER1 CH|' +
      'second=S EH1 K AX0 N D|secret=S IY1 K R AX0 T|secure=S IH0 K Y UH1 R|sequence=S IY1 K W AX0 N S|' +
      'seven=S EH1 V AX0 N|seventeen=S EH1 V AX0 N T IY1 N|seventy=S EH1 V AX0 N T IY0|shall=SH AE1 L|' +
      'shield=SH IY1 L D|shields=SH IY1 L D Z|shutdown=SH AH1 T D AW2 N|sixteen=S IH1 K S T IY1 N|' +
      'someone=S AH1 M W AH2 N|sorry=S AA1 R IY0|sure=SH UH1 R|sword=S AO1 R D|system=S IH1 S T AX0 M|' +
      'systems=S IH1 S T AX0 M Z|target=T AA1 R G AX0 T|temperature=T EH1 M P R AX0 CH ER0|the=DH AX0|thirteen=TH ER1 T IY1 N|' +
      'thousand=TH AW1 Z AX0 N D|three=TH R IY1|to=T UW0|today=T AX0 D EY1|today\'s=T AX0 D EY1 Z|' +
      'together=T AX0 G EH1 DH ER0|tomorrow=T AX0 M AA1 R OW0|tower=T AW1 ER0|town=T AW1 N|' +
      'traveler=T R AE1 V AX0 L ER0|two=T UW1|until=AX0 N T IH1 L|user=Y UW1 Z ER0|verified=V EH1 R AX0 F AY2 D|' +
      'very=V EH1 R IY0|victory=V IH1 K T ER0 IY0|village=V IH1 L AX0 JH|wait=W EY1 T|want=W AA1 N T|' +
      'warning=W AO1 R N IH0 NG|was=W AH0 Z|water=W AO1 T ER0|weapon=W EH1 P AX0 N|weapons=W EH1 P AX0 N Z|' +
      'weather=W EH1 DH ER0|welcome=W EH1 L K AX0 M|were=W ER0|what=W AH1 T|what\'s=W AH1 T S|' +
      'whatever=W AH0 T EH1 V ER0|wind=W IH1 N D|window=W IH1 N D OW0|with=W IH0 DH|wizard=W IH1 Z ER0 D|' +
      'wolf=W UH1 L F|woman=W UH1 M AX0 N|women=W IH1 M AX0 N|yes=Y EH1 S|you=Y UW1|you\'re=Y UH1 R|your=Y AO1 R|' +
      'zero=Z IH1 R OW0|' +
      // common app, game and interface words the rules got wrong (2026-10-24; checked against a
      // reference pronunciation, the kind of word a line of UI copy carries)
      'reactor=R IY0 AE1 K T ER0|completed=K AX0 M P L IY1 T IH0 D|update=AH0 P D EY1 T|updated=AH0 P D EY1 T IH0 D|' +
      'login=L AO1 G IH0 N|profile=P R OW1 F AY2 L|database=D EY1 T AX0 B EY2 S|enabled=EH0 N EY1 B AX0 L D|' +
      'disabled=D IH0 S EY1 B AX0 L D|connected=K AX0 N EH1 K T IH0 D|' +
      'disconnected=D IH0 S K AX0 N EH1 K T IH0 D|objective=AX0 B JH EH1 K T IH0 V|enemies=EH1 N AX0 M IY0 Z|' +
      'achievement=AX0 CH IY1 V M AX0 N T|unlocked=AH0 N L AA1 K T|emergency=IH0 M ER1 JH AX0 N S IY0|' +
      'acquired=AX0 K W AY1 ER0 D|destroyed=D IH0 S T R OY1 D|calibration=K AE2 L AX0 B R EY1 SH AX0 N|' +
      'diagnostic=D AY2 AX0 G N AA1 S T IH0 K|navigation=N AE2 V AX0 G EY1 SH AX0 N|' +
      'coordinates=K OW0 AO1 R D AX0 N AX0 T S|altitude=AE1 L T AX0 T UW2 D|velocity=V AX0 L AA1 S AX0 T IY0|' +
      'airlock=EH1 R L AA2 K|unauthorized=AH0 N AO1 TH ER0 AY2 Z D|confirm=K AX0 N F ER1 M|' +
      'confirmed=K AX0 N F ER1 M D|continue=K AX0 N T IH1 N Y UW0|restart=R IY0 S T AA1 R T|select=S AX0 L EH1 K T|' +
      'selected=S AX0 L EH1 K T IH0 D|inventory=IH1 N V AX0 N T AO2 R IY0|ancient=EY1 N SH AX0 N T|' +
      'legend=L EH1 JH AX0 N D|heroes=HH IH1 R OW0 Z|tournament=T UH1 R N AX0 M AX0 N T|final=F AY1 N AX0 L|' +
      'finish=F IH1 N IH0 SH|finished=F IH1 N IH0 SH T|evening=IY1 V N IH0 NG|' +
      'congratulations=K AX0 N G R AE2 CH AX0 L EY1 SH AX0 N Z|amazing=AX0 M EY1 Z IH0 NG|' +
      'incredible=IH0 N K R EH1 D AX0 B AX0 L|legendary=L EH1 JH AX0 N D EH2 R IY0|' +
      'impossible=IH0 M P AA1 S AX0 B AX0 L|important=IH0 M P AO1 R T AX0 N T|failure=F EY1 L Y ER0|' +
      'success=S AX0 K S EH1 S|successful=S AX0 K S EH1 S F AX0 L|operation=AA2 P ER0 EY1 SH AX0 N|' +
      'operational=AA2 P ER0 EY1 SH AX0 N AX0 L|available=AX0 V EY1 L AX0 B AX0 L|' +
      'unavailable=AH2 N AX0 V EY1 L AX0 B AX0 L|temporary=T EH1 M P ER0 EH2 R IY0|permanent=P ER1 M AX0 N AX0 N T|' +
      'automatic=AO2 T AX0 M AE1 T IH0 K|artificial=AA2 R T AX0 F IH1 SH AX0 L|' +
      'intelligence=IH0 N T EH1 L AX0 JH AX0 N S|algorithm=AE1 L G ER0 IH2 DH AX0 M|processor=P R AA1 S EH2 S ER0|' +
      'microphone=M AY1 K R AX0 F OW2 N|volume=V AA1 L Y UW0 M|notification=N OW2 T AX0 F AX0 K EY1 SH AX0 N|' +
      'schedule=S K EH1 JH UW0 L|appointment=AX0 P OY1 N T M AX0 N T|photo=F OW1 T OW0|favorite=F EY1 V ER0 IH0 T|' +
      'library=L AY1 B R EH2 R IY0|category=K AE1 T AX0 G AO2 R IY0|version=V ER1 ZH AX0 N|release=R IY0 L IY1 S|' +
      'experimental=IH0 K S P EH2 R AX0 M EH1 N T AX0 L|beta=B EY1 T AX0|preview=P R IY1 V Y UW2|' +
      'pilot=P AY1 L AX0 T|sergeant=S AA1 R JH AX0 N T|general=JH EH1 N ER0 AX0 L|soldier=S OW1 L JH ER0|' +
      'ally=AE1 L AY0|allies=AE1 L AY0 Z|dungeon=D AH1 N JH AX0 N|arrow=AE1 R OW0|mana=M AA1 N AX0|' +
      'respawn=R IY0 S P AO1 N|multiplayer=M AH1 L T IY0 P L EY2 ER0|leaderboard=L IY1 D ER0 B AO2 R D|' +
      'trophy=T R OW1 F IY0|challenge=CH AE1 L AX0 N JH|coffee=K AO1 F IY0|breakfast=B R EH1 K F AX0 S T|' +
      'forecast=F AO1 R K AE2 S T|thunderstorm=TH AH1 N D ER0 S T AO2 R M|fahrenheit=F EH1 R AX0 N HH AY2 T|' +
      'equals=IY1 K W AX0 L Z|total=T OW1 T AX0 L|increase=IH0 N K R IY1 S|decrease=D IH0 K R IY1 S|' +
      'percentage=P ER0 S EH1 N T IH0 JH|account=AX0 K AW1 N T|purchase=P ER1 CH AX0 S|receipt=R IH0 S IY1 T|' +
      'premium=P R IY1 M IY0 AX0 M|arrived=ER0 AY1 V D|arriving=ER0 AY1 V IH0 NG|boarding=B AO1 R D IH0 NG|' +
      'platform=P L AE1 T F AO2 R M|elevator=EH1 L AX0 V EY2 T ER0|basement=B EY1 S M AX0 N T|' +
      'opening=OW1 P AX0 N IH0 NG|restricted=R IH0 S T R IH1 K T IH0 D|register=R EH1 JH IH0 S T ER0|' +
      'laboratory=L AE1 B R AX0 T AO2 R IY0|protocol=P R OW1 T AX0 K AO2 L|quarantine=K W AO1 R AX0 N T IY2 N|' +
      'biohazard=B AY1 OW0 HH AE2 Z ER0 D|anomaly=AX0 N AA1 M AX0 L IY0|anomalies=AX0 N AA1 M AX0 L IY0 Z|' +
      'generator=JH EH1 N ER0 EY2 T ER0|turbine=T ER1 B AY0 N|hyperdrive=HH AY1 P ER0 D R AY2 V|' +
      'frequency=F R IY1 K W AX0 N S IY0|encrypted=EH0 N K R IH1 P T IH0 D|decrypted=D IY0 K R IH1 P T IH0 D|' +
      'firewall=F AY1 ER0 W AO2 L|malware=M AE1 L W EH2 R|analysis=AX0 N AE1 L AX0 S IH0 S|' +
      'analyzing=AE1 N AX0 L AY2 Z IH0 NG|calculating=K AE1 L K Y AX0 L EY2 T IH0 NG|' +
      'compiling=K AX0 M P AY1 L IH0 NG|rendering=R EH1 N D ER0 IH0 NG|' +
      'synchronizing=S IH1 NG K R AX0 N AY2 Z IH0 NG|initializing=IH0 N IH1 SH AX0 L AY2 Z IH0 NG|' +
      'generating=JH EH1 N ER0 EY2 T IH0 NG|searching=S ER1 CH IH0 NG').split('|');
    Z.x = {};
    for (const s of L) { const k = s.indexOf('='); Z.x[s.slice(0, k)] = s.slice(k + 1); }
    Z.l = 'EY1|B IY1|S IY1|D IY1|IY1|EH1 F|JH IY1|EY1 CH|AY1|JH EY1|K EY1|EH1 L|EH1 M|EH1 N|OW1|P IY1|K Y UW1|AA1 R|EH1 S|T IY1|Y UW1|V IY1|D AH1 B AX0 L Y UW0|EH1 K S|W AY1|Z IY1'.split('|');
  }
  const VOW = 'AEIOU';
  const isVow = (c) => VOW.includes(c);
  const isCons = (c) => c >= 'A' && c <= 'Z' && !isVow(c);
  // one context, matched leftward (dir -1, from p) or rightward (dir 1, from p); returns fit or not
  const fits = (w, ctx, p, dir) => {
    const n = ctx.length;
    for (let k = 0; k < n; k++) {
      const c = ctx[dir < 0 ? n - 1 - k : k];
      const ch = w[p] || ' ';
      if (c === ' ') { if (ch >= 'A' && ch <= 'Z') return false; p += dir; continue; }
      if (c === '#') { if (!isVow(ch)) return false; while (isVow(w[p] || ' ')) p += dir; continue; }
      if (c === ':') { while (isCons(w[p] || ' ')) p += dir; continue; }
      if (c === '^') { if (!isCons(ch)) return false; p += dir; continue; }
      if (c === '.') { if (!'BDVGJLMNRWZ'.includes(ch)) return false; p += dir; continue; }
      if (c === '+') { if (!'EIY'.includes(ch)) return false; p += dir; continue; }
      if (c === '%') {
        if (dir < 0) return false;
        if (w.startsWith('ING', p)) p += 3;
        else if (w.startsWith('ELY', p)) p += 3;
        else if (ch === 'E') p += 'RSD'.includes(w[p + 1] || ' ') ? 2 : 1;
        else return false;
        continue;
      }
      if (c === '&' || c === '@') {
        const two = dir < 0 ? (w[p - 1] || '') + ch : ch + (w[p + 1] || '');
        if (['CH', 'SH'].includes(two) || (c === '@' && two === 'TH')) { p += 2 * dir; continue; }
        if (!(c === '&' ? 'SCGZXJ' : 'TSRDLZNJ').includes(ch)) return false;
        p += dir;
        continue;
      }
      if (ch !== c) return false;
      p += dir;
    }
    return true;
  };
  // NRL symbols to ARPAbet: two capitals as they are (WH as W), j JH, h HH, other letters upper case
  const arpa = (out) => {
    const res = [];
    for (let i = 0; i < out.length;) {
      const c = out[i];
      if (c >= 'a' && c <= 'z') { res.push(c === 'j' ? 'JH' : c === 'h' ? 'HH' : c.toUpperCase()); i++; continue; }
      const two = out.slice(i, i + 2);
      res.push(two === 'WH' ? 'W' : two);
      i += 2;
    }
    return res;
  };
  const VOWELS = /^(AA|AE|AH|AO|AW|AX|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/;
  // stress for a ruled word: the suffix decides when it can (-tion, -ic: the syllable before;
  // -ity, -ogy: two before; -ee, -eer: the last), else the first full vowel; other long vowels
  // take a secondary stress
  const stressed = (ph, word) => {
    const vi = [];
    ph.forEach((p, i) => { if (VOWELS.test(p)) vi.push(i); });
    if (!vi.length) return ph;
    let pick = -1;
    const n = vi.length;
    if (n > 1) {
      if (/(tion|sion|cian|cial|tial|cious|tious|ic|ics)s?$/.test(word)) pick = n - 2;
      else if (/(ial|ian|ious|ient|ience|ior|ity|ify|ogy|ical|ative|eous)s?$/.test(word)) pick = Math.max(0, n - 3);
      else if (/(ee|eer|ese|ette|ique|oo)s?$/.test(word)) pick = n - 1;
      else if (/^(be|de|re|pre)[^aeiou]/.test(word) && /^(IH|IY)$/.test(ph[vi[0]])) pick = 1;
    }
    if (pick < 0) { pick = vi.findIndex((i) => ph[i] !== 'AX'); if (pick < 0) pick = 0; }
    // an unstressed EH, AE, AA or AO is a schwa in English (basket, salad, balloon); the rules give
    // the full vowel of the spelling
    return ph.map((p, i) => {
      if (!VOWELS.test(p)) return p;
      if (i === vi[pick]) return (p === 'AX' ? 'AH' : p) + '1';
      if (/^(EH|AE|AA|AO)$/.test(p)) return 'AX0';
      return p + (/^(AY|EY|OY|AW|OW)$/.test(p) && n > 1 ? '2' : '0');
    });
  };
  const rules = (word) => {
    const w = ' ' + word.toUpperCase() + ' ';
    let out = '';
    for (let p = 1; p < w.length - 1;) {
      const list = Z.r[w[p]];
      let hit = null;
      if (list) {
        for (const r of list) {
          if (!w.startsWith(r[1], p)) continue;
          if (!fits(w, r[0], p - 1, -1) || !fits(w, r[2], p + r[1].length, 1)) continue;
          hit = r;
          break;
        }
      }
      if (!hit) { p++; continue; }
      out += hit[3];
      p += hit[1].length;
    }
    // a doubled letter the rules leave doubled (FF, MM, TT) is one sound in English, and DG and
    // TCH are one affricate (edge, match)
    const ph = arpa(out).filter((x, i, all) => !(i && x === all[i - 1] && !VOWELS.test(x)) &&
      !((x === 'D' && all[i + 1] === 'JH') || (x === 'T' && all[i + 1] === 'CH')));
    return stressed(ph, word.toLowerCase()).join(' ');
  };
  // numbers to words
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const say = (n) => {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + say(n % 100) : '');
    for (const [v, name] of [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']]) {
      if (n >= v) return say(Math.floor(n / v)) + ' ' + name + (n % v ? ' ' + say(n % v) : '');
    }
    return '';
  };
  const ORD = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
  const numberWords = (s, ord) => {
    const neg = s[0] === '-';
    const [ip, fp] = s.replace(/^-/, '').replace(/,/g, '').split('.');
    let words = ip.length > 1 && ip[0] === '0' ? ip.split('').map((d) => ONES[+d]).join(' ') : ip.length > 12 ? ip.split('').map((d) => ONES[+d]).join(' ') : say(Number(ip));
    if (ord) {
      const parts = words.split(' ');
      const last = parts.pop();
      parts.push(ORD[last] || (last.endsWith('y') ? last.slice(0, -1) + 'ieth' : last + 'th'));
      words = parts.join(' ');
    }
    if (fp) words += ' point ' + fp.split('').map((d) => ONES[+d]).join(' ');
    return (neg ? 'minus ' : '') + words;
  };
  const SYM = { '%': 'percent', '&': 'and', '+': 'plus', '@': 'at', '=': 'equals', '#': 'number', $: 'dollars' };
  const out = [];
  const lookup = (raw) => {
    const w = raw.toLowerCase();
    if (Z.x[w]) return Z.x[w];
    if (/^[A-Z]{2,5}$/.test(raw) && !/[AEIOUY]/.test(raw)) return raw.split('').map((c) => Z.l[c.charCodeAt(0) - 65]).join(' / ');
    if (/^[a-z]$/i.test(raw)) return Z.l[w.charCodeAt(0) - 97];
    // a plural or possessive of a known word
    const m = /^(.{3,}?)(\u0027s|s\u0027)$/.exec(w) || /^(.{2,}[^s])(s)$/.exec(w);
    if (m && Z.x[m[1]]) {
      const base = Z.x[m[1]];
      const last = base.split(' ').pop().replace(/[0-2]/, '');
      return base + (/^(S|Z|SH|ZH|CH|JH)$/.test(last) ? ' IH0 Z' : /^(P|T|K|F|TH)$/.test(last) ? ' S' : ' Z');
    }
    // the rules voice a final S only in a few contexts: after a voiced sound a plural S is a Z
    // ("degrees", "meters")
    const r = rules(w);
    return /[^siu]s$/.test(w) ? r.replace(/([AEIOU][A-Z][0-2]|\b[BDGVZMNLRWY]|DH|ZH|JH|NG) S$/, '$1 Z') : r;
  };
  const toks = String(text || '').replace(/[\u2018\u2019]/g, "'").replace(/\u2026/g, '...')
    .match(/\[[^\]]*\]|-?\d+(?:,\d{3})*(?:\.\d+)?(?:st|nd|rd|th)?|[A-Za-z]+(?:\u0027[A-Za-z]+)*|\.\.\.|[.,!?;:]|[%&+@=#$]|\s-\s|[()\u0022]/g) || [];
  for (const tk of toks) {
    if (tk[0] === '[') { out.push(tk.slice(1, -1).trim().toUpperCase()); continue; }
    if (/^(\.\.\.|[.,!?;:])$/.test(tk)) { out.push(tk); continue; }
    if (/^\s-\s$|^[()\u0022]$/.test(tk)) { out.push(','); continue; }
    if (SYM[tk]) { out.push(lookup(SYM[tk])); continue; }
    if (/^-?\d/.test(tk)) {
      const m = /^(.*?)(st|nd|rd|th)?$/.exec(tk);
      for (const w of numberWords(m[1], !!m[2]).split(' ')) out.push(lookup(w));
      continue;
    }
    out.push(lookup(tk));
  }
  // words joined by '/', punctuation set off by spaces; a pause never doubles up
  let res = '';
  for (const s of out) {
    if (!s) continue;
    const punct = /^(\.\.\.|[.,!?;:])$/.test(s);
    if (punct) { if (/[.,!?;:]$/.test(res)) continue; res += (res ? ' ' : '') + s; continue; }
    res += res && !/[.,!?;:]$/.test(res) ? ' / ' + s : (res ? ' ' : '') + s;
  }
  return res.replace(/^[,;:]\s*/, '');
}

export interface SpeechChallenge {
  id: string;
  index: string;
  title: string;
  summary: string;
  childExample: string;
  contextNote: string;
}

export interface UnderstandingPillar {
  index: string;
  title: string;
  description: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
  key: 'speak' | 'listen' | 'understand' | 'learn';
}

export interface LanguageItem {
  id: string;
  name: string;
  nativeName: string;
  scriptClass: string;
  samplePhrase: string;
  englishMeaning: string;
}

export interface HinglishSample {
  id: string;
  label: string;
  spoken: string;
  intent: string;
}

export interface PreviewTopic {
  id: string;
  label: string;
  ageGroup: string;
  transcripts: Record<
    string,
    {
      childPrompt: string;
      buddyClarification: string;
      answerTitle: string;
      answerBody: string;
      keyTakeaway: string;
    }
  >;
}

export const SPEECH_CHALLENGES: SpeechChallenge[] = [
  {
    id: 'patterns',
    index: '01',
    title: 'Different speaking patterns',
    summary:
      'Children think aloud while they talk — starting fast, slowing down mid-thought, or repeating words as ideas form.',
    childExample: '"Wait... woh plant jo hai na, uska leaf green kyun hota hai, matlab sunlight se?"',
    contextNote: 'Captures the full question across restarts without cutting the child off.',
  },
  {
    id: 'pitch',
    index: '02',
    title: 'High-pitched voices',
    summary:
      'Younger vocal tracts have higher fundamental frequencies and lighter resonances that standard adult models often misread.',
    childExample: '"Didi, why do stars twinkle at night and not in the morning?"',
    contextNote: 'Tuned acoustically for children aged 6–14 rather than adult voice profiles.',
  },
  {
    id: 'pronunciation',
    index: '03',
    title: 'Pronunciation differences',
    summary:
      'Developing readers and young speakers naturally soften, blend, or approximate unfamiliar school vocabulary.',
    childExample: '"Photo-sin-the-sis kaise kaam karta hai when there is no sun?"',
    contextNote: 'Understands phonetically close scientific terms from context.',
  },
  {
    id: 'accents',
    index: '04',
    title: 'Regional accents',
    summary:
      'Every home across India carries its own cadence, vowel warmth, and regional rhythm when speaking English or local tongues.',
    childExample: '"Is three-fourth bigger than half, ya dono same near hain?"',
    contextNote: 'Respects regional cadence without forcing children to change how they speak.',
  },
  {
    id: 'pauses',
    index: '05',
    title: 'Pauses and incomplete sentences',
    summary:
      'Curious kids pause to think, glance at a notebook, or search for the right word before finishing a question.',
    childExample: '"If gravity pulls everything down... then why... why doesn’t the moon fall?"',
    contextNote: 'Waits patiently through natural thinking pauses instead of interrupting early.',
  },
  {
    id: 'noise',
    index: '06',
    title: 'Background noise',
    summary:
      'Real learning happens beside ceiling fans, siblings playing, kitchen sounds, and lively study rooms — never in a quiet studio.',
    childExample: '"Can you explain fractions again? Sorry, mera bhai baat kar raha tha."',
    contextNote: 'Focuses on the child’s voice amid everyday household sounds.',
  },
  {
    id: 'code-switching',
    index: '07',
    title: 'Hindi-English code-switching',
    summary:
      'Children fluidly mix Hindi and English inside a single sentence — using English school words with Hindi grammar.',
    childExample: '"Water cycle mein evaporation ke baad clouds kaise bante hain?"',
    contextNote: 'Follows seamless bilingual flow as one natural thought.',
  },
];

export const UNDERSTANDING_PILLARS: UnderstandingPillar[] = [
  {
    index: '01',
    title: 'Listens carefully',
    description:
      'Gives children room to pause, self-correct, and think aloud without rushing to respond.',
  },
  {
    index: '02',
    title: 'Understands spoken questions',
    description:
      'Grasps meaning behind everyday phrasing, regional cadence, and mixed-language curiosity.',
  },
  {
    index: '03',
    title: 'Recognises uncertainty',
    description:
      'Notices when a child sounds hesitant, stuck halfway through a concept, or unsure where to begin.',
  },
  {
    index: '04',
    title: 'Asks clarification when necessary',
    description:
      'Checks in gently with one simple follow-up instead of guessing wrong or giving an overwhelming answer.',
  },
  {
    index: '05',
    title: 'Explains educational concepts simply',
    description:
      'Breaks big school ideas into warm, relatable, age-appropriate stories and step-by-step examples.',
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: '01',
    title: 'Speak',
    description:
      'A child asks a question naturally in their own voice, pace, and everyday language.',
    key: 'speak',
  },
  {
    step: '02',
    title: 'Listen',
    description:
      'BoloBuddy stays patient through pauses, background sounds, and mid-sentence switches.',
    key: 'listen',
  },
  {
    step: '03',
    title: 'Understand',
    description:
      'It interprets intent, notices hesitation, and asks a gentle clarification if needed.',
    key: 'understand',
  },
  {
    step: '04',
    title: 'Learn',
    description:
      'The concept unfolds clearly in simple language, inviting the next curious question.',
    key: 'learn',
  },
];

export const SUPPORTED_LANGUAGES: LanguageItem[] = [
  {
    id: 'hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    scriptClass: 'font-[var(--font-devanagari)]',
    samplePhrase: 'आसमान दिन में नीला और शाम को सुनहरा क्यों दिखता है?',
    englishMeaning: 'Why does the sky look blue by day and golden by evening?',
  },
  {
    id: 'english',
    name: 'English',
    nativeName: 'English',
    scriptClass: 'font-sans',
    samplePhrase: 'How do tiny seeds know which way to grow upward?',
    englishMeaning: 'Natural spoken English tuned for young learners.',
  },
  {
    id: 'bengali',
    name: 'Bengali',
    nativeName: 'বাংলা',
    scriptClass: 'font-[var(--font-bengali)]',
    samplePhrase: 'গাছ কীভাবে সূর্যের আলো থেকে নিজের খাবার তৈরি করে?',
    englishMeaning: 'How do plants make their own food from sunlight?',
  },
  {
    id: 'tamil',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    scriptClass: 'font-[var(--font-tamil)]',
    samplePhrase: 'மழை பெய்யும்போது இடி ஏன் மின்னலுக்குப் பிறகு கேட்கிறது?',
    englishMeaning: 'Why do we hear thunder after we see lightning?',
  },
  {
    id: 'telugu',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    scriptClass: 'font-[var(--font-telugu)]',
    samplePhrase: 'చంద్రుడు కొన్ని రోజులు గుండ్రంగా, కొన్ని రోజులు సగంగా ఎందుకు కనిపిస్తాడు?',
    englishMeaning: 'Why does the moon look round on some nights and half on others?',
  },
  {
    id: 'marathi',
    name: 'Marathi',
    nativeName: 'मराठी',
    scriptClass: 'font-[var(--font-devanagari)]',
    samplePhrase: 'आपल्याला उन्हाळ्यात जास्त तहान का लागते?',
    englishMeaning: 'Why do we feel thirstier during the summer?',
  },
];

export const HINGLISH_SAMPLES: HinglishSample[] = [
  {
    id: 'science',
    label: 'Science curiosity',
    spoken: '"Magnet sirf iron ko kyun attract karta hai, plastic ya wood ko kyun nahi?"',
    intent: 'Understands magnetic materials and answers in warm, clear Hinglish.',
  },
  {
    id: 'math',
    label: 'Everyday maths',
    spoken: '"Agar pizza ke 8 slices hain aur maine 3 khaye, toh fraction kya hoga?"',
    intent: 'Connects 3/8 directly to visual slices without textbook jargon.',
  },
  {
    id: 'geography',
    label: 'Earth & weather',
    spoken: '"Pahadon par garmi ke time bhi itni thand kyun lagti hai?"',
    intent: 'Explains altitude and thinner air using familiar everyday analogies.',
  },
];

export const PREVIEW_LANGUAGES = [
  { id: 'hinglish', label: 'Hinglish' },
  { id: 'hindi', label: 'हिन्दी' },
  { id: 'english', label: 'English' },
  { id: 'bengali', label: 'বাংলা' },
  { id: 'tamil', label: 'தமிழ்' },
  { id: 'telugu', label: 'తెలుగు' },
  { id: 'marathi', label: 'मराठी' },
] as const;

export type PreviewLanguageId = (typeof PREVIEW_LANGUAGES)[number]['id'];

export const PREVIEW_TOPICS: PreviewTopic[] = [
  {
    id: 'sky-blue',
    label: 'Why is the sky blue?',
    ageGroup: 'Ages 8–11 · Science',
    transcripts: {
      hinglish: {
        childPrompt:
          '“Umm… sunlight toh white lagti hai, phir sky blue kyun dikhta hai?”',
        buddyClarification:
          '“Great observation! You noticed white sunlight actually holds many colours inside it. Let’s look at how blue light travels.”',
        answerTitle: 'Blue light scatters across the sky',
        answerBody:
          'Sunlight mixes all rainbow colours together. When it enters Earth’s air, tiny gas particles bounce the shorter blue waves in every direction — painting the whole sky soft powder blue.',
        keyTakeaway: 'At sunset, light travels further through air, so warm peach and golden colours reach your eyes instead.',
      },
      hindi: {
        childPrompt:
          '“सूरज की रोशनी तो सफेद दिखती है, फिर आसमान नीला क्यों होता है?”',
        buddyClarification:
          '“बहुत अच्छा सवाल! सफेद रोशनी में असल में इंद्रधनुष के सारे रंग छिपे होते हैं। आइए देखें नीला रंग कैसे फैलता है।”',
        answerTitle: 'हवा के कण नीले रंग को फैलाते हैं',
        answerBody:
          'जब सूरज की रोशनी धरती की हवा से टकराती है, तो नीले रंग की छोटी तरंगें हर तरफ बिखर जाती हैं। इसलिए ऊपर देखने पर पूरा आसमान नीला दिखाई देता है।',
        keyTakeaway: 'शाम के समय रोशनी लंबा रास्ता तय करती है, इसलिए हमें हल्का नारंगी और सुनहरा रंग दिखता है।',
      },
      english: {
        childPrompt:
          '“If sunlight looks white or yellow… why does the whole sky turn blue?”',
        buddyClarification:
          '“Lovely question! White sunlight actually carries every colour of the rainbow tucked inside it.”',
        answerTitle: 'Air scatters blue waves everywhere',
        answerBody:
          'As sunlight reaches Earth’s atmosphere, tiny air molecules bump into the light. Blue light travels in shorter, bouncy waves, so it scatters across the sky in all directions.',
        keyTakeaway: 'That is also why evenings glow warm peach — blue scatters away before reaching you.',
      },
      bengali: {
        childPrompt:
          '“সূর্যের আলো তো সাদা, তাহলে আকাশটা নীল দেখায় কেন?”',
        buddyClarification:
          '“খুব সুন্দর প্রশ্ন! সাদা আলোর ভেতরেই কিন্তু রামধনুর সাতটি রঙ লুকিয়ে থাকে।”',
        answerTitle: 'বাতাসের কণা নীল আলোকে ছড়িয়ে দেয়',
        answerBody:
          'সূর্যের আলো পৃথিবীর বাতাসে ঢুকলে বাতাসের সূক্ষ্ম কণাগুলো নীল আলোর ছোট তরঙ্গকে চারদিকে ছড়িয়ে দেয়। তাই আমরা আকাশকে নীল দেখি।',
        keyTakeaway: 'সন্ধ্যায় আলো অনেক দূর দিয়ে আসে বলে তখন আকাশে সোনালি ও গোলাপি আভা দেখা যায়।',
      },
      tamil: {
        childPrompt:
          '“சூரிய ஒளி வெள்ளையாக இருக்கிறதே, பிறகு வானம் ஏன் நீலமாகத் தெரிகிறது?”',
        buddyClarification:
          '“மிக நல்ல கேள்வி! வெள்ளை ஒளிக்குள் வானவில்லின் எல்லா நிறங்களும் ஒளிந்திருக்கின்றன.”',
        answerTitle: 'காற்றுத் துகள்கள் நீல ஒளியைச் சிதறடிக்கின்றன',
        answerBody:
          'சூரிய ஒளி பூமியின் காற்று மண்டலத்தில் நுழையும்போது, சிறிய அலைநீளம் கொண்ட நீல ஒளி எல்லா திசைகளிலும் சிதறுகிறது. அதனால் வானம் நீலமாகத் தெரிகிறது.',
        keyTakeaway: 'மாலையில் ஒளி நீண்ட தூரம் பயணிப்பதால் வானம் இளஞ்சிவப்பு மற்றும் பொன்னிறமாக மாறுகிறது.',
      },
      telugu: {
        childPrompt:
          '“సూర్యకాంతి తెల్లగా ఉంటుంది కదా, మరి ఆకాశం నీలంగా ఎందుకు కనిపిస్తుంది?”',
        buddyClarification:
          '“చాలా మంచి ప్రశ్న! తెల్లటి సూర్యకాంతిలో ఇంద్రధనుస్సు రంగులన్నీ కలిసి ఉంటాయి.”',
        answerTitle: 'గాలిలోని కణాలు నీలి రంగును వెదజల్లుతాయి',
        answerBody:
          'సూర్యకాంతి భూమి వాతావరణంలోకి వచ్చినప్పుడు, చిన్న తరంగాలు ఉండే నీలి రంగు గాలిలోని అణువుల వల్ల అన్ని వైపులా చెల్లాచెదురు అవుతుంది.',
        keyTakeaway: 'సాయంత్రం వేళ కాంతి ఎక్కువ దూరం ప్రయాణించడం వల్ల ఆకాశం లేత నారింజ రంగులో మెరుస్తుంది.',
      },
      marathi: {
        childPrompt:
          '“सूर्याचा प्रकाश पांढरा असतो, मग आकाश निळे का दिसते?”',
        buddyClarification:
          '“खूप छान प्रश्न विचारलास! पांढऱ्या प्रकाशात इंद्रधनुष्याचे सर्व रंग दडलेले असतात.”',
        answerTitle: 'हवेतील कण निळा रंग सर्वत्र पसरवतात',
        answerBody:
          'सूर्याचा प्रकाश पृथ्वीच्या वातावरणात येतो, तेव्हा हवेतील सूक्ष्म कण निळ्या रंगाच्या लहान लहरींना चहूबाजूंनी विखुरतात. त्यामुळे आकाश निळे दिसते.',
        keyTakeaway: 'संध्याकाळी प्रकाश लांबचा प्रवास करतो, म्हणून आपल्याला केशरी आणि सोनेरी छटा दिसतात.',
      },
    },
  },
  {
    id: 'plants-food',
    label: 'How do plants make food?',
    ageGroup: 'Ages 7–11 · Biology',
    transcripts: {
      hinglish: {
        childPrompt:
          '“Plants toh chal nahi sakte… phir unhe apna food kahan se milta hai?”',
        buddyClarification:
          '“Think of every green leaf like a quiet kitchen! Want to see the three ingredients it uses?”',
        answerTitle: 'Leaves cook with sunlight, water, and air',
        answerBody:
          'Roots drink water from the soil, tiny pores on leaves breathe in carbon dioxide from the air, and green chlorophyll catches sunlight to turn them into sweet plant energy.',
        keyTakeaway: 'While making their own food, plants also gift fresh oxygen back into the air for us.',
      },
      hindi: {
        childPrompt:
          '“पौधे चल भी नहीं सकते, फिर वे अपना खाना कैसे बनाते हैं?”',
        buddyClarification:
          '“हर हरी पत्ती को एक छोटी सी रसोई समझो! आइए देखें इसमें कौन सी तीन चीज़ें मिलती हैं।”',
        answerTitle: 'पत्ते धूप, पानी और हवा से खाना बनाते हैं',
        answerBody:
          'जड़ें मिट्टी से पानी लेती हैं, पत्ते हवा से कार्बन डाइऑक्साइड लेते हैं और हरा रंग सूरज की धूप पकड़कर पौधे के लिए ऊर्जा बनाता है।',
        keyTakeaway: 'खाना बनाते समय पौधे हमारे लिए ताज़ी ऑक्सीजन भी छोड़ते हैं।',
      },
      english: {
        childPrompt:
          '“Trees don’t eat meals like us… so how do they grow so tall?”',
        buddyClarification:
          '“Every green leaf works like a tiny sunlit kitchen. Here are its three simple ingredients.”',
        answerTitle: 'Photosynthesis inside green leaves',
        answerBody:
          'Roots sip water from soil, leaves take in carbon dioxide from the air, and green chlorophyll uses sunlight energy to combine them into sugar that helps the plant grow.',
        keyTakeaway: 'As a helpful bonus, leaves release clean oxygen into the breeze.',
      },
      bengali: {
        childPrompt:
          '“গাছ তো আমাদের মতো খাবার খায় না, তাহলে বড় হয় কীভাবে?”',
        buddyClarification:
          '“প্রতিটি সবুজ পাতাকে একটি ছোট রান্নাঘর ভাবো! রোদ পেলেই পাতার রান্না শুরু হয়।”',
        answerTitle: 'আলো, জল ও বাতাস দিয়ে খাবার তৈরি',
        answerBody:
          'শিকড় মাটি থেকে জল টেনে নেয়, পাতা বাতাস থেকে কার্বন ডাই-অক্সাইড নেয়, আর সূর্যের আলো কাজে লাগিয়ে নিজের খাবার তৈরি করে।',
        keyTakeaway: 'এই সময় গাছ বাতাসে আমাদের জন্য তাজা অক্সিজেন ছেড়ে দেয়।',
      },
      tamil: {
        childPrompt:
          '“மரங்கள் நடப்பதில்லையே, பிறகு அவை எப்படி உணவு தயாரிக்கின்றன?”',
        buddyClarification:
          '“ஒவ்வொரு பச்சை இலையும் ஒரு சிறிய சமையலறை போல செயல்படுகிறது!”',
        answerTitle: 'சூரிய ஒளியால் இலைகளில் உணவு தயாரிப்பு',
        answerBody:
          'வேர்கள் மண்ணிலிருந்து நீரை உறிஞ்சுகின்றன, இலைகள் காற்றிலிருந்து கார்பன் டை ஆக்சைடை எடுத்து சூரிய ஒளியின் உதவியால் சர்க்கரையாக மாற்றுகின்றன.',
        keyTakeaway: 'அப்போது தாவரங்கள் நமக்குத் தேவையான தூய ஆக்ஸிஜனை வெளியிடுகின்றன.',
      },
      telugu: {
        childPrompt:
          '“చెట్లు మనలాగా భోజనం చేయవు కదా, మరి అవి ఎలా పెరుగుతాయి?”',
        buddyClarification:
          '“ప్రతి ఆకుపచ్చ ఆకు ఒక చిన్న వంటగది లాంటిది! సూర్యరశ్మితో అవి ఆహారం చేసుకుంటాయి.”',
        answerTitle: 'ఆకులలో కిరణజన్య సంయోగక్రియ',
        answerBody:
          'వేర్లు నేల నుండి నీటిని తీసుకుంటాయి, ఆకులు గాలి నుండి కార్బన్ డయాక్సైడ్‌ను గ్రహించి ఎండ సాయంతో మొక్కకు శక్తినిచ్చే ఆహారాన్ని తయారు చేస్తాయి.',
        keyTakeaway: 'ఈ ప్రక్రియలో చెట్లు మన కోసం స్వచ్ఛమైన ఆక్సిజన్‌ను గాలిలోకి వదులుతాయి.',
      },
      marathi: {
        childPrompt:
          '“झाडे चालू शकत नाहीत, मग ती स्वतःचे अन्न कसे बनवतात?”',
        buddyClarification:
          '“प्रत्येक हिरवे पान हे जणू एक छोटे स्वयंपाकघर असते! सूर्यप्रकाशात हा स्वयंपाक तयार होतो.”',
        answerTitle: 'पाने सूर्यप्रकाश, पाणी आणि हवेतून अन्न बनवतात',
        answerBody:
          'मुळे जमिनीतून पाणी शोषतात, पाने हवेतील कार्बन डायऑक्साइड घेतात आणि सूर्यप्रकाशाच्या मदतीने झाडासाठी गोड ऊर्जा तयार करतात.',
        keyTakeaway: 'याच वेळी झाडे आपल्याला श्वास घेण्यासाठी ताजा ऑक्सिजन देतात.',
      },
    },
  },
  {
    id: 'fractions',
    label: 'Fractions in everyday life',
    ageGroup: 'Ages 8–12 · Maths',
    transcripts: {
      hinglish: {
        childPrompt:
          '“Sir ne 1/4 aur 1/2 bola… par 4 toh 2 se bada hai, phir 1/4 chhota kyun?”',
        buddyClarification:
          '“Such a smart doubt! Let’s picture one warm roti cut into equal pieces.”',
        answerTitle: 'More slices mean smaller pieces',
        answerBody:
          'If you share one roti between 2 friends, each gets a big half (1/2). If 4 friends share that same roti, each piece becomes smaller (1/4) because it is divided more times.',
        keyTakeaway: 'The bottom number tells how many equal shares you split one whole into.',
      },
      hindi: {
        childPrompt:
          '“4 तो 2 से बड़ा होता है, फिर 1/4 हिस्सा 1/2 से छोटा क्यों होता है?”',
        buddyClarification:
          '“बहुत बढ़िया शक! चलो एक गोल रोटी के बराबर टुकड़े करके देखते हैं।”',
        answerTitle: 'जितने ज़्यादा हिस्से, उतना छोटा टुकड़ा',
        answerBody:
          'अगर एक रोटी को 2 लोगों में बांटें तो आधा-आधा बड़ा टुकड़ा मिलता है (1/2)। लेकिन वही रोटी 4 लोगों में बांटने पर हर टुकड़ा छोटा (1/4) हो जाता है।',
        keyTakeaway: 'नीचे लिखी संख्या बताती है कि पूरी चीज़ को कितने बराबर भागों में बांटा गया है।',
      },
      english: {
        childPrompt:
          '“Wait… why is 1/4 smaller than 1/2 when 4 is bigger than 2?”',
        buddyClarification:
          '“That trips almost everyone up at first! Picture sharing one whole chocolate bar.”',
        answerTitle: 'Sharing with more people makes smaller pieces',
        answerBody:
          'When you split one chocolate bar between 2 friends, each gets a large half (1/2). When 4 friends share that exact same bar, each piece (1/4) has to be smaller.',
        keyTakeaway: 'The bottom number counts the total equal shares, not the size of each piece.',
      },
      bengali: {
        childPrompt:
          '“৪ তো ২-এর চেয়ে বড়, তাহলে ১/৪ ভাগ ১/২ ভাগের চেয়ে ছোট হয় কেন?”',
        buddyClarification:
          '“খুব বুদ্ধিমানের প্রশ্ন! চলো একটি কেক সমান ভাগে কেটে বুঝি।”',
        answerTitle: 'যত বেশি ভাগ, প্রতিটি টুকরো তত ছোট',
        answerBody:
          'একটি কেক ২ জনে ভাগ করলে বড় অর্ধেক (১/২) পাওয়া যায়। কিন্তু ওই একই কেক ৪ জনে ভাগ করলে প্রত্যেকের ভাগে ছোট টুকরো (১/৪) পড়ে।',
        keyTakeaway: 'নিচের সংখ্যাটি বোঝায় পুরো জিনিসটাকে মোট কয়টি সমান টুকরো করা হয়েছে।',
      },
      tamil: {
        childPrompt:
          '“2-ஐ விட 4 பெரியது தானே, பிறகு ஏன் 1/4 என்பது 1/2-ஐ விட சிறியது?”',
        buddyClarification:
          '“மிகச் சிறந்த சந்தேகம்! ஒரு முழு தோசையைப் பகிர்ந்து பார்ப்போம்.”',
        answerTitle: 'அதிக பங்குகள் என்றால் சிறிய துண்டுகள்',
        answerBody:
          'ஒரு தோசையை 2 பேருக்குப் பிரித்தால் பெரிய பாதி (1/2) கிடைக்கும். அதே தோசையை 4 பேருக்குப் பிரித்தால் ஒவ்வொரு துண்டும் சிறியதாக (1/4) மாறும்.',
        keyTakeaway: 'கீழே உள்ள எண் எத்தனை சம பங்குகளாகப் பிரிக்கப்பட்டது என்பதைச் சொல்கிறது.',
      },
      telugu: {
        childPrompt:
          '“2 కంటే 4 పెద్దది కదా, మరి 1/4 అనేది 1/2 కంటే ఎందుకు చిన్నది?”',
        buddyClarification:
          '“చాలా తెలివైన సందేహం! ఒకే చాక్లెట్‌ను పంచుకుని చూద్దాం.”',
        answerTitle: 'ఎక్కువ మంది పంచుకుంటే ముక్క చిన్నదవుతుంది',
        answerBody:
          'ఒక చాక్లెట్‌ను 2 ముక్కలు చేస్తే పెద్ద సగం (1/2) వస్తుంది. అదే చాక్లెట్‌ను 4 సమ భాగాలు చేస్తే ప్రతి ముక్క చిన్నదిగా (1/4) మారుతుంది.',
        keyTakeaway: 'కింద ఉండే సంఖ్య ఒక వస్తువును ఎన్ని సమ భాగాలుగా చేశామో చెబుతుంది.',
      },
      marathi: {
        childPrompt:
          '“4 ही संख्या 2 पेक्षा मोठी आहे, मग 1/4 हा 1/2 पेक्षा लहान का असतो?”',
        buddyClarification:
          '“खूप छान प्रश्न! आपण एका पोळीचे समान तुकडे करून समजून घेऊया.”',
        answerTitle: 'जास्त भाग केल्यास प्रत्येक तुकडा लहान होतो',
        answerBody:
          'एक पोळी २ जणांत वाटली तर मोठा अर्धा भाग (1/2) मिळतो. पण तीच पोळी ४ जणांत वाटली तर प्रत्येकाला लहान तुकडा (1/4) मिळतो.',
        keyTakeaway: 'खालची संख्या सांगते की एका पूर्ण वस्तूचे किती समान भाग केले आहेत.',
      },
    },
  },
  {
    id: 'thunder',
    label: 'What makes thunder?',
    ageGroup: 'Ages 6–10 · Nature',
    transcripts: {
      hinglish: {
        childPrompt:
          '“Baarish mein pehle lightning dikhti hai, aur thunder thodi der baad kyun aata hai?”',
        buddyClarification:
          '“You’re racing light against sound! Want to know why light always wins?”',
        answerTitle: 'Light travels much faster than sound',
        answerBody:
          'Lightning heats the air so fast that it makes a loud rumble called thunder. Both happen together in the clouds, but light reaches your eyes instantly while sound takes a few seconds to travel.',
        keyTakeaway: 'Every 3 seconds between flash and rumble means the storm is roughly 1 kilometre away.',
      },
      hindi: {
        childPrompt:
          '“बारिश में पहले बिजली दिखती है और गरज थोड़ी देर बाद क्यों सुनाई देती है?”',
        buddyClarification:
          '“यहाँ रोशनी और आवाज़ की दौड़ हो रही है! आइए जानें रोशनी पहले क्यों पहुँचती है।”',
        answerTitle: 'रोशनी आवाज़ से बहुत तेज़ चलती है',
        answerBody:
          'बिजली चमकने से हवा अचानक गर्म होकर गड़गड़ाहट की आवाज़ बनाती है। दोनों एक ही समय होते हैं, लेकिन रोशनी तुरंत आँखों तक आती है और आवाज़ कुछ सेकंड बाद पहुँचती है।',
        keyTakeaway: 'चमक और गरज के बीच के सेकंड गिनकर आप बादल की दूरी का अंदाज़ा लगा सकते हैं।',
      },
      english: {
        childPrompt:
          '“Why do we always see lightning first and hear thunder a few seconds later?”',
        buddyClarification:
          '“Lightning and thunder happen at the exact same moment — it’s a race between light and sound!”',
        answerTitle: 'Light zooms faster than sound waves',
        answerBody:
          'A lightning bolt heats nearby air rapidly, creating a big sound wave called thunder. Light reaches your eyes almost instantly, while sound strolls much more slowly through the air.',
        keyTakeaway: 'Counting 3 seconds between the flash and boom means the cloud is about 1 km away.',
      },
      bengali: {
        childPrompt:
          '“মেঘ ডাকলে আগে বিদ্যুৎ চমকায়, আর শব্দটা পরে শোনা যায় কেন?”',
        buddyClarification:
          '“এটা আলো আর শব্দের দৌড় প্রতিযোগিতা! আলো সব সময়ই আগে পৌঁছায়।”',
        answerTitle: 'আলোর গতি শব্দের চেয়ে অনেক বেশি',
        answerBody:
          'বিদ্যুৎ আর মেঘের গর্জন একই সাথে তৈরি হয়। কিন্তু আলো চোখের পলকে আমাদের কাছে চলে আসে, আর বাতাসের ভেতর দিয়ে শব্দ আসতে একটু সময় লাগে।',
        keyTakeaway: 'আলো আর শব্দের সময়ের পার্থক্য গুনে মেঘ কত দূরে আছে তা বোঝা যায়।',
      },
      tamil: {
        childPrompt:
          '“வானத்தில் முதலில் மின்னல் தெரிகிறது, இடி சத்தம் ஏன் தாமதமாகக் கேட்கிறது?”',
        buddyClarification:
          '“இது ஒளிக்கும் ஒலிக்கும் இடையேயான ஓட்டப்பந்தயம் போன்றது!”',
        answerTitle: 'ஒளி ஒலியை விட மிக வேகமாகப் பயணிக்கிறது',
        answerBody:
          'மின்னலும் இடியும் ஒரே நேரத்தில் தான் உருவாகின்றன. ஆனால் ஒளி கணநேரத்தில் நம் கண்களை அடைகிறது; காற்றில் ஒலி வர சில நொடிகள் ஆகின்றன.',
        keyTakeaway: 'மின்னலுக்கும் இடிக்கும் இடையே 3 நொடிகள் இருந்தால் மேகம் சுமார் 1 கி.மீ தூரத்தில் உள்ளது.',
      },
      telugu: {
        childPrompt:
          '“వర్షం వచ్చేటప్పుడు ముందు మెరుపు కనిపించి, ఉరుము తర్వాత ఎందుకు వినిపిస్తుంది?”',
        buddyClarification:
          '“ఇది కాంతి మరియు శబ్దం మధ్య జరిగే పరుగు పందెం లాంటిది!”',
        answerTitle: 'శబ్దం కంటే కాంతి చాలా వేగంగా ప్రయాణిస్తుంది',
        answerBody:
          'మెరుపు మరియు ఉరుము మేఘాలలో ఒకేసారి పుడతాయి. కానీ కాంతి కంటిరెప్ప పాటులో మన దగ్గరకు వస్తుంది, శబ్దం గాలిలో నెమ్మదిగా ప్రయాణించి తర్వాత చేరుతుంది.',
        keyTakeaway: 'మెరుపుకి ఉరుముకి మధ్య 3 సెకన్లు ఉంటే మేఘం సుమారు 1 కిలోమీటర్ దూరంలో ఉన్నట్లు.',
      },
      marathi: {
        childPrompt:
          '“पावसात आधी वीज चमकते आणि गडगडाट थोड्या वेळाने का ऐकू येतो?”',
        buddyClarification:
          '“ही प्रकाश आणि आवाजाची शर्यत आहे! प्रकाश नेहमीच पुढे धावतो.”',
        answerTitle: 'प्रकाश आवाजापेक्षा खूप वेगाने प्रवास करतो',
        answerBody:
          'वीज चमकणे आणि मेघगर्जना एकाच वेळी होतात. पण प्रकाश डोळ्यांपर्यंत क्षणात पोहोचतो, तर आवाज हवेतून प्रवास करत काही सेकंदांनंतर आपल्या कानावर पडतो.',
        keyTakeaway: 'चमक आणि आवाजात ३ सेकंदांचे अंतर असेल तर ढग सुमारे १ किमी दूर असतो.',
      },
    },
  },
];

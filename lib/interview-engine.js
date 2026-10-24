/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
// lib/interview-engine.js
// Shared production logic for GlanceAI: technical speech sanitization,
// question detection, follow-up classification, and resume intelligence.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GlanceAIEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  function isCandidateHonorificAddress(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim().toLowerCase();
    if (/^(yes|yeah|yep|okay|ok|sure|alright|no|so|well)?\s*(,\s*)?(sir|ma'?am|madam|mam)\b/i.test(clean)) return true;
    if (/\b(thank\s+you|thanks|yes|okay|ok|sure)\s+(sir|ma'?am|madam|mam)[.?!]?$/i.test(clean)) return true;
    return false;
  }

  function isDeclarativeAnswer(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.toLowerCase().trim();
    if (isCandidateHonorificAddress(clean)) return true;
    if (/\b(whereas|meanwhile|in contrast to|on the other hand)\b/.test(clean)) return true;
    if (/\b(is|was|are|were)\s+(chosen|used|preferred|designed|built)\s+for\b/.test(clean)) return true;
    if (/\bwhich\s+(are|is|means|gives|provides|allows|enables)\s+(essential|critical|helpful|important)\b/.test(clean)) return true;
    if (/^(i|we)\s+(chose|choose|used|picked|went with|started with|decided to|prefer)\b/.test(clean)) return true;
    if (/\b(so\s+)?(i'll|i\s+will|i'm\s+going\s+to|let\s+me|i\s+can)\s+(start|begin|code|write|type|implement|code\s+this|condition|set\s+up|create|define|iterate)\b/.test(clean)) return true;
    if (/^(so|now|then)?\s*(i'll|i\s+will|i'm\s+going\s+to)\b/.test(clean)) return true;
    return false;
  }

  // Call logistics and small talk ("Can you hear me?", "What happened?", "How is it?", "What topic you want?"):
  // matched only when the whole sentence is that phrase, so "How is it different from a mutex?" still counts
  const META_CHATTER_SENTENCE = /^(?:(?:so|okay|ok|yeah|yes|and|alright|hello|hi|hey|sorry|wait|um|uh|hmm)[,.!\s]+)*(?:(?:can|could)\s+you\s+(?:hear|see)\s+(?:me|my\s+screen|it)|am\s+i\s+audible|are\s+you\s+(?:there|ready|able\s+to\s+hear(?:\s+me)?)|what\s+happened|is\s+(?:it|this|everything|my\s+(?:audio|mic|video|screen))\s+(?:working|fine|okay|ok|visible|audible)|how\s+(?:is|was)\s+(?:it|that|this)|(?:what|which)\s+topic\s+(?:do\s+)?you\s+want|(?:shall|should|can)\s+we\s+(?:start|begin|continue|proceed))(?:\s+(?:now|then|sir|ma'?am))?[\s?.!]*$/i;

  function stripMetaChatter(text) {
    return text.split(/(?<=[.?!])\s+/).filter(sentence => !META_CHATTER_SENTENCE.test(sentence.trim())).join(' ').trim();
  }

  function isLikelyInterviewQuestion(text) {
    if (!text || text.trim().length < 5) return false;
    const clean = stripMetaChatter(text.trim());
    if (clean.length < 5) return false;

    // Disqualify candidate answers and respectful addresses
    if (isCandidateHonorificAddress(clean)) return false;
    if (isDeclarativeAnswer(clean)) return false;

    // Disqualify conversational filler & interviewer intros that are NOT questions
    const conversationalFiller = /^(i\s+will\s+be|we\s+will\s+be|feel\s+free\s+to|let'?s\s+get\s+started|welcome\s+to|nice\s+to\s+meet|good\s+morning|good\s+afternoon|hello|hi|hey|thanks\s+for\s+joining|today\s+we\s+will|let'?s\s+move\s+on)\b/i;
    if (conversationalFiller.test(clean)) return false;

    if (clean.endsWith('?')) return true;

    // 1. Targeted interrogatives (which, where, when, who must be interrogatives)
    const targetedInterrogative = /\b(which\s+(one|database|algorithm|approach|data structure|table|method|option|is|are|would|should|do|does|can)|where\s+(does|do|is|are|would|should|can|could|we|will)|when\s+(does|do|is|are|would|should|can|could|we|will)|who\s+(is|are|would|should|can|could|will|did))\b/i;
    if (targetedInterrogative.test(clean)) return true;

    // 2. Broad technical question & instruction patterns
    // Note: 'will' is only interrogative when starting a question; 'write/code/implement' require coding objects
    const interrogativeRegex = /\b(how|what|why|explain|tell me|walk me|describe|discuss|difference|suppose|what if|how would|have you|give me|compare|instead of|what about|how about|alternative|trade-?off|better way|show me|do you)\b/i;
    if (interrogativeRegex.test(clean)) return true;

    // Modal auxiliaries ask only when they open a sentence or clause ("Could you optimize it", "okay, can we cache it"),
    // not mid-statement ("Nobody could ask a harder question than bit masking")
    const modalQuestionRegex = /(?:^|[.?!;,]\s*)(?:(?:so|okay|ok|and|alright|all right|now|then|yeah|yes|right|well|but|also|um|uh|fine|great|good)[,\s]+)*(can|could|would|should|is it|is there|does it|do we)\b/i;
    if (modalQuestionRegex.test(clean)) return true;

    // Will as auxiliary question starter ("Will this scale?", "Will it work?")
    if (/^\s*(?:so\s+)?will\s+(you|we|it|this|that|there|they)\b/i.test(clean)) return true;

    // Direct imperative coding instructions
    const codingInstructionRegex = /\b(write\s+(?:the\s+)?code|code\s+(?:up|for|this|an?)|implement\s+(?:a|an|the|this)|solve\s+(?:this|the)|design\s+(?:a|an|the)|build\s+(?:a|an|the)|reverse\s+a\s+linked list)\b/i;
    if (codingInstructionRegex.test(clean)) return true;

    // 3. Typical coding problem phrasings & algorithm names
    const codingProblemRegex = /\b(given\s+(an?|two|the|some)|return\s+(the|a|true|false)|find\s+(the|all|maximum|minimum)|calculate\s+(the)?|(two|to|too)\s+(sum|some)|(three|free|tree)\s+(sum|some)|trie\s+(two|to|too)\s+(some|sum)|lru cache|reverse\s+(a\s+)?linked list|valid parentheses|merge\s+(k\s+)?sorted|binary tree|in-place|time complexity|space complexity)\b/i;
    if (codingProblemRegex.test(clean)) return true;

    return false;
  }

  function isCodingQuestion(text, responseMode = 'adaptive') {
    if (responseMode === 'coding') return true;
    if (!text || typeof text !== 'string') return false;
    const clean = text.toLowerCase().trim();

    // 1. Explicit requests for code blocks, snippets, samples, or implementations
    if (/\b(?:code\s*(?:block|snippet|sample|example)|(?:sample|example)\s*code|example\s+in\s+code|in\s+code|with\s+code|show\s+code)\b/i.test(clean)) {
      return true;
    }
    if (/\b(?:give|show|provide|share|write|display)\s+(?:me\s+)?(?:an?\s+|the\s+)?(?:code|snippet|implementation|example\s+code)\b/i.test(clean)) {
      return true;
    }
    if (/\bcode\s+(?:for|of|to|demonstrating|showing|illustrating)\b/i.test(clean)) {
      return true;
    }

    // 2. Direct imperative coding requests
    if (/\b(write\s+(?:the\s+)?code|write\s+(?:a\s+)?(?:program|function|script|class|solution|implementation|code)|code\s+(?:up|for|this|an?)|how\s+to\s+code|solve\s+(?:the\s+)?code|code\s+(?:in|for)\s+(?:c\+\+|cpp|python|java|javascript|typescript|golang|go|rust))\b/i.test(clean)) {
      return true;
    }

    // 3. Implementation of algorithms / data structures / design patterns
    if (/\b(?:implement|code|write)\s+(?:an?\s+)?(?:lru|lfu|trie|mergesort|quicksort|dijkstra|binary\s+search|linked\s*list|heap|stack|queue|hash\s*map|bst|avl|red-black|cache|algorithm|data\s+structure|solution|code|class|function|method|singleton|factory|observer|decorator|adapter|polymorphism|inheritance|deadlock|mutex)\b/i.test(clean)) {
      return true;
    }

    // 4. Specific DSA / algorithmic problem requests
    if (/\b(lru\s*cache|lfu\s*cache|two\s*sum|three\s*sum|reverse\s+(?:a\s+)?linked\s*list|invert\s+(?:a\s+)?binary\s*tree|merge\s*sort|quick\s*sort|binary\s*search|valid\s*parentheses|trap(?:ping)?\s*rain\s*water|longest\s+substring|kth\s+largest|median\s+of\s+two\s+sorted|clone\s+graph|word\s+ladder|course\s+schedule)\b/i.test(clean)) {
      if (/\b(write|code|implement|solution|solve|function|program|c\+\+|cpp|python|java|how\s+to\s+solve)\b/i.test(clean)) {
        return true;
      }
    }

    // 5. Questions asking for code in a programming language
    if (/\b(write|code|show\s+me|give\s+me)\b.*\b(in\s+(?:c\+\+|cpp|python|java|javascript|typescript|golang|go|rust|c#))\b/i.test(clean)) {
      return true;
    }

    // 6. OOP and Systems code implementations (e.g. polymorphism, inheritance, encapsulation, virtual functions, RAII, smart pointers)
    if (/\b(?:polymorphism|inheritance|encapsulation|abstraction|virtual\s+destructor|raii|smart\s+pointers?|mutex|semaphore)\s+(?:code|implementation|example)\b/i.test(clean) ||
        /\b(?:write|show|give|provide)\s+(?:an?\s+)?(?:example\s+of\s+)?(?:polymorphism|inheritance|encapsulation|abstraction|raii)\s+(?:code|in\s+(?:c\+\+|cpp|python|java|rust|golang))\b/i.test(clean) ||
        /\b(?:polymorphism|inheritance)\s+code\b/i.test(clean)) {
      return true;
    }

    // 7. Screen captures & competitive programming problems (e.g. "Screen: 38. Count and Say", numbered problems, LeetCode)
    if (/\bscreen:\s*(\d+[\.\-\:]|[a-z0-9\s\-]+)/i.test(clean) ||
        /^\d+[\.\-\:]\s*[a-z]/i.test(clean) ||
        /\b(leetcode|hackerrank|codeforces|codility)\b/i.test(clean) ||
        /\b(coding\s+challenge|optimal\s+(?:cpp|c\+\+|python|java|code|solution)|solve\s+it\s+with\s+optimal)\b/i.test(clean)) {
      return true;
    }

    return false;
  }

  function isFollowUpQuestion(text, conversationHistory = []) {
    if (!text || !Array.isArray(conversationHistory) || conversationHistory.length === 0) return false;
    const clean = text.toLowerCase().trim();
    const lastTurn = conversationHistory[conversationHistory.length - 1];
    if (!lastTurn || !lastTurn.question) return false;

    const lastQ = (lastTurn.question || '').toLowerCase();
    const lastSummary = (lastTurn.solutionSummary || '').toLowerCase();
    const lastContext = `${lastQ} ${lastSummary}`;

    // Disqualify if too much time elapsed between turns (> 120 seconds = new topic)
    if (lastTurn.timestamp && (Date.now() - lastTurn.timestamp) > 120000) {
      return false;
    }

    // List of explicit named subjects/algorithms/entities that represent standalone questions
    const knownStandaloneEntities = [
      'mergesort', 'merge sort', 'quicksort', 'quick sort', 'heapsort', 'heap sort',
      'binary search', 'trie', 'lru cache', 'lfu cache', 'avl tree', 'red-black tree',
      'bfs', 'dfs', 'dijkstra', 'bellman-ford', 'floyd-warshall', 'topological sort',
      'polymorphism', 'inheritance', 'virtual inheritance', 'diamond problem',
      'association', 'aggregation', 'composition', 'constructor', 'destructor',
      'virtual function', 'pure virtual', 'abstract class', 'interface',
      'overloading', 'overriding', 'multithreading', 'concurrency',
      'mutex', 'semaphore', 'spinlock', 'deadlock', 'livelock', 'starvation',
      'bios', 'kernel', 'paging', 'virtual memory', 'segmentation',
      'langgraph', 'autopatch', 'vasool', 'kafka', 'redis', 'postgres', 'postgresql',
      'sqlite', 'mongodb', 'docker', 'kubernetes', 'graphql', 'grpc', 'websocket',
      'webhook', 'hmac', 'idempotency', 'fastify', 'fastapi', 'acid', 'b-tree', 'lsm-tree'
    ];

    // Check if the current question explicitly asks about a known standalone entity
    // that was NOT mentioned in the previous turn
    for (const entity of knownStandaloneEntities) {
      const entityRegex = new RegExp(`\\b${entity.replace(/-/g, '[- ]')}\\b`, 'i');
      if (entityRegex.test(clean) && !entityRegex.test(lastContext)) {
        return false;
      }
    }

    // Check if the current question explicitly introduces its own subject via "what is / what are / define / explain X"
    const introMatch = clean.match(/\b(?:what\s+is|what\s+are|define|explain)\s+(?:an?\s+|the\s+)?([a-z0-9_\s-]{3,40}?)(?:\?|[,;]|\s+and|\s+how|\s+why|$)/i);
    if (introMatch && introMatch[1]) {
      const candidateTopic = introMatch[1].trim();
      // Ignore anaphoric pronouns, interrogatives, or follow-up attributes (complexity, time, space, etc.)
      const isAnaphoric = /^(it|that|this|these|those|its|their|what|how|why|where|who)\b/i.test(candidateTopic) ||
                          /\b(complexity|time|space|trade-?offs?|runtime|bottleneck|anomalies|what\s+it\s+is|what\s+that\s+is)\b/i.test(candidateTopic);
      if (!isAnaphoric) {
        // If the candidate topic was NOT in the prior context, this is a brand new question!
        if (!lastContext.includes(candidateTopic)) {
          return false;
        }
      }
    }

    const hasAnaphoricPronoun = /\b(it|that|this\s+(?:approach|method|solution|algorithm|code|pattern)|its\s+(?:time|space|complexity|anomalies|trade-?offs?)|those|these\s+anomalies|here|in\s+this|in\s+that)\b/i.test(clean);

    const directFollowUpPhrases = [
      'instead of', 'what if', 'what happens if',
      'can we optimize', 'could we optimize', 'can we do it', 'could we do it',
      'in place', 'in-place', 'without extra space', 'no extra space', 'constant space',
      'o\\(1\\)', 'what are the trade-offs', 'what are the tradeoffs', 'what are the anomalies',
      'explain what it is', 'explain what they are', 'explain that', 'elaborate on that',
      'tell me more about that', 'what do you mean by that', 'what did you mean by that',
      'under the hood', 'how does that work', 'break that down',
      'so you told me', 'you told me', 'you mentioned', 'as you said', 'like you said',
      'earlier you said', 'earlier you mentioned'
    ];

    for (const phrase of directFollowUpPhrases) {
      if (new RegExp(`\\b${phrase}\\b`, 'i').test(clean)) {
        return true;
      }
    }

    if (hasAnaphoricPronoun && /\b(why|how|complexity|faster|space|time|improve|memory|work|works|fail|fails|handle|solve|use|choose|hash|map|pointer|anomaly|anomalies|explain|mean|differ)\b/i.test(clean)) {
      return true;
    }

    const lastQWords = lastQ
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['what', 'how', 'when', 'where', 'which', 'write', 'code', 'explain', 'tell', 'about', 'your', 'this', 'that', 'with', 'from'].includes(w));

    let sharedSignificantWords = 0;
    for (const w of lastQWords) {
      if (clean.includes(w)) sharedSignificantWords++;
    }

    if (sharedSignificantWords >= 2 && /\b(instead|alternative|other|better|different|optimize|improve|without|why|trade-?off)\b/i.test(clean)) {
      return true;
    }

    return false;
  }

  function sanitizeTechnicalTranscript(text) {
    if (!text || typeof text !== 'string') return text;
    let s = text;

    const corrections = [
      // 0. Disambiguate auxiliary "does" vs algorithm "DFS" (syntactic, not semantic — safe)
      [/\b(what|how|why|where|when|which)\s+(?:dfs|d\s*f\s*s)\s+(your|the|this|that|it|a|an|my|our|one|each|we|you)\b/gi, '$1 does $2'],
      [/\b(what|how|why|where|when|which)\s+(?:dfs|d\s*f\s*s)\s+([a-zA-Z0-9_-]+)\s+(do|work|mean|handle|scale|use|need|provide|support|achieve|recover)\b/gi, '$1 does $2 $3'],
      [/^\s*(?:dfs|d\s*f\s*s)\s+(your|the|this|that|it|a|an|my|our|one|each|we|you)\b/gi, 'Does $1'],
      [/\b(?:dfs|d\s*f\s*s)\s+your\s+project\b/gi, 'does your project'],
      [/\bwhat\s+(?:dfs|d\s*f\s*s)\b/gi, 'what does'],

      // 1. AI, Agents, LLM & Workflow Frameworks (zero English collision)
      [/\b(land\s*graf|land\s*graph|land\s*rapture|land\s*capture|line\s*graph(?!\s+(?:chart|plot|axis)))\b/gi, 'LangGraph'],
      [/\ba\s+land\s*graph\b/gi, 'LangGraph'],
      [/\ba\s+land\s*graf\b/gi, 'LangGraph'],
      [/\bauto\s*pack(?:\s+ai)?\b/gi, 'AutoPatch'],
      [/\b(project\s+)?(?:vasul|vassal)\b/gi, '$1Vasool'],
      [/\b(gen\s+ai|gen\s*a\s*i)\b/gi, 'GenAI'],
      [/\b(l\s*l\s*m|l\s*l\s*ms)\b/gi, 'LLM'],

      // 2. OOP & Language Paradigms (anchored to unambiguous context)
      [/\b(diamond\s+problem\s*(?:in|and)?\s*)hoops\b/gi, '$1OOPs'],
      [/\b(?:in|and|about|concepts?\s+of|advantages?\s+of|benefits?\s+of|features?\s+of|pillars?\s+of|principles?\s+of|basics?\s+of|need\s+of|uses?\s+of)\s+hoops\b/gi, (m) => m.replace(/hoops/i, 'OOPs')],
      [/\bhoops\s+(?:concepts?|principles?|basics?|paradigm|pillars?|features?|advantages?|benefits?)\b/gi, 'OOPs $1'],
      [/\b(?:advantages?|benefits?|features?|pillars?)\s+of\s+hoops\b/gi, '$1 of OOPs'],
      [/\bwhat\s+is\s+(?:a\s+)?constructed\b/gi, 'what is a constructor'],
      [/\b(o\s*o\s*p|o\s*o\s*p\s*s)\b/gi, 'OOPs'],

      // 3. Data Structures & Queues (zero English collision)
      [/\bwhat\s+is\s+(?:a\s+)?d\s*q\b/gi, 'What is a deque'],
      [/\b(?:a|the)\s+d\s*q\b/gi, '$1 deque'],
      [/\b(d\s*q|dq)\s+(?:data\s+structure|in\s+c\+\+|in\s+python|stl|container)\b/gi, 'deque $1'],
      [/\breverse\s+an?\s+english\b/gi, 'reverse a linked list'],
      [/\ban?\s+english\s+list\b/gi, 'a linked list'],

      // 4. Database Systems — ACID (zero collision)
      [/\b(?:asset|acidic)\s+properties\b/gi, 'ACID properties'],
      [/\basset\s+in\s+dbms\b/gi, 'ACID in DBMS'],

      // 5. Regulatory Standards & Indian Compliance (zero collision)
      [/\b(r\s*b\s*i)\b/gi, 'RBI'],
      [/\b(d\s*p\s*d\s*p)\b/gi, 'DPDP'],
      [/\b(t\s*r\s*a\s*i)\b/gi, 'TRAI'],
      [/\b(n\s*p\s*c\s*i)\b/gi, 'NPCI'],
      [/\b(u\s*p\s*i)\b/gi, 'UPI'],
      [/\b(k\s*y\s*c)\b/gi, 'KYC'],
      [/\b(a\s*s\s*t)\s+(analysis|tree|parser|visitor)\b/gi, 'AST $2'],

      // 6. Two Sum — ONLY safe, heavily-anchored multi-word patterns
      [/\b(trie|try)\s+(to|too|two)\s+(some|sum)\b/gi, 'try Two Sum'],
      [/\bwrite\s+(the\s+)?code\s+for\s+(to|too|two)\s+(some|sum)\b/gi, 'write the code for Two Sum'],
      [/\bcode\s+(for\s+)?(to|too|two)\s+(some|sum)\b/gi, 'code for Two Sum'],
      [/\bsome\s+some\b/gi, 'Two Sum'],
      // NOTE: Bare "to some" / "to sum" / "free some" / "three sum" patterns REMOVED.
      // Context-dependent Two Sum / Three Sum disambiguation is now handled by the LLM system prompt.

      // 7. LRU / LFU Cache (zero collision)
      [/\b(?:the\s+)?portal\s+(?:and\s+)?(?:are\s+you|r\s+u)\s*cache\b/gi, 'code for LRU cache'],
      [/\b(?:and\s+)?(?:are\s+you|r\s+u)\s*cache\b/gi, 'LRU cache'],
      [/\b(yellow\s*you|l\s*r\s*u)\s*(cache)?\b/gi, 'LRU cache'],
      [/\b(l\s*f\s*u)\s*(cache)?\b/gi, 'LFU cache'],

      // 8. Trie vs Try Coreference (anchored to unambiguous followers)
      [/\btrie\s+(two\s+sum|three\s+sum|solve|solving|implement|write|code|running)\b/gi, 'try $1'],
      [/\btry\s+(tree|prefix\s+tree|data\s+structure|node|implementation)\b/gi, 'Trie $1'],

      // 9. Complexity & Big-O Notation (deterministic formatting)
      [/\b(big\s+oh|big\s+o)\b/gi, 'Big-O'],
      [/\bo\s+of\s+n\s+(squared|square)\b/gi, 'O(n^2)'],
      [/\bo\s+of\s+log\s+n\b/gi, 'O(log n)'],
      [/\bo\s+of\s+n\s+log\s+n\b/gi, 'O(n log n)'],
      [/\bo\s+of\s+n\b/gi, 'O(n)'],
      [/\bo\s+of\s+1\b/gi, 'O(1)'],
      [/\btime\s+complex\b/gi, 'time complexity'],
      [/\bspace\s+complex\b/gi, 'space complexity'],

      // 10. Algorithms & Data Structures (deterministic phonetic maps + formatting)
      [/\b(dike\s*stra|dye\s*extra|dijk\s*stra)\b/gi, 'Dijkstra'],
      [/\b(link\s*list|linked\s*lists?)\b/gi, 'linked list'],
      [/\b(hash\s*map|hash\s*maps?)\b/gi, 'hash map'],
      [/\b(hash\s*table|hash\s*tables?)\b/gi, 'hash table'],
      [/\bquick\s*sort\b/gi, 'quicksort'],
      [/\bmerge\s*sort\b/gi, 'mergesort'],
      [/\bbinary\s+search\s+tree\b/gi, 'binary search tree'],
      [/\bmono\s*tonic\s+stack\b/gi, 'monotonic stack'],
      [/\bsliding\s+window\b/gi, 'sliding window'],
      [/\btwo\s+pointers?\b/gi, 'two pointers'],
      [/\bb\s+f\s+s\b/gi, 'BFS'],
      [/\bd\s+f\s+s\b/gi, 'DFS'],
      // NOTE: Bare BFS/DFS greedy single-char matches REMOVED (collide with VFS, NFS, etc.).
      // The LLM system prompt handles BFS/DFS/VFS/NFS disambiguation contextually.

      // 11. Databases, Systems & Concurrency (deterministic phonetic maps only)
      [/\b(cough\s+car|cuff\s+car)\b/gi, 'Kafka'],
      [/\b(post\s*grass|post\s*gray|postgres\s*sql|posters?\s+spill)\b/gi, 'PostgreSQL'],
      [/\b(spill\s*light|spill\s*lite|sql\s*light|sql\s*lite|sql\s*time|sequel\s*light|sequel\s*lite)\b/gi, 'SQLite'],
      [/\bwhy\s+(?:p99\s+aws\s+a\s+epoll|p99\s+postgresql\s+pool)\s+over[.\s]+.*?\??$/gi, 'Why PostgreSQL over SQLite?'],
      [/\b(?:different|difference)\s+between\s+(?:energy\s+and\s+auto\s*zone|inner\s+and\s+outer\s+zone)\b/gi, 'difference between inner join and outer join'],
      [/\b(?:energy\s+and\s+auto\s*zone|inner\s+and\s+outer\s+zone)\b/gi, 'inner join and outer join'],
      [/\bdifferent\s+between\b/gi, 'difference between'],
      [/\b(inner|outer|left|right|cross|full|natural)\s+joints?\b/gi, '$1 join'],
      [/\bno\s+sql\b/gi, 'NoSQL'],
      [/\bmy\s+sql\b/gi, 'MySQL'],
      // NOTE: "red is" → Redis, "a sink" → async, "a weight" → await, "sequel" → SQL,
      // "no sequel" → NoSQL, "rpc" → gRPC all REMOVED. These are context-dependent
      // and are now handled by the LLM system prompt.
      [/\bitem\s+poten(t|cy)\b/gi, 'idempotency'],
      [/\bgo\s+routines?\b/gi, 'goroutines'],
      [/\bmute\s+text\b/gi, 'mutex'],
      [/\bdoc\s+ker\b/gi, 'Docker'],
      [/\bb\s+tree\b/gi, 'B-Tree'],
      [/\blsm\s+tree\b/gi, 'LSM-Tree'],
      [/\bgraph\s+q\s*l\b/gi, 'GraphQL'],
      [/\bweb\s+sockets?\b/gi, 'WebSockets'],
      [/\bweb\s*books?\b/gi, (m) => m.toLowerCase().endsWith('s') ? 'webhooks' : 'webhook'],
      [/\b(?:what\s+is\s+(?:the\s+)?|how\s+does\s+)h\s*vac\b/gi, (m) => m.replace(/h\s*vac/i, 'HMAC')],
      [/\b(?:what\s+is\s+(?:an?\s+|the\s+)?|how\s+does\s+)h\s*mac\b/gi, (m) => m.replace(/h\s*mac/i, 'HMAC')],
      [/\bh\s*mac\b/gi, 'HMAC'],
      [/\be\s*mandates?\b/gi, 'e-mandate'],
      [/\bkube\s*(netes|8s)?\b/gi, 'Kubernetes'],
      [/\bcap\s+theorem\b/gi, 'CAP theorem'],
      // Heard in a live mock interview (Indian English) for "rate limiting"
      [/\b(?:radio|grid)\s+(?:routing|limiting)\b/gi, 'rate limiting'],
      [/\btwo\s+some\b/gi, 'Two Sum'],
      [/\ban\s+english\b/gi, 'a linked list'],

      // 12. DBMS Normalization, Normal Forms, Locks & OS Low-Level
      [/\b([123])\s*n\s*f\b/gi, '$1NF'],
      [/\b(?:3\s*c\s*n\s*f|three\s*c\s*n\s*f|b\s*c\s*n\s*f|b\.\s*c\.\s*n\.\s*f\.)\b/gi, 'BCNF'],
      [/\bnomination\s+leak\b/gi, 'normalization is'],
      [/\bnomination\b/gi, 'normalization'],
      [/\bnational\s+relation\b/gi, 'relational schema'],
      [/\bleak\s+delays?\s*(?:acid\s*)?anomalies\b/gi, 'insert and delete anomalies'],
      [/\bleak\s+delays?\b/gi, 'delete'],
      [/\b(animal\s+lease|animal\s+ease)\b/gi, 'anomalies'],
      [/\bin\s+read\s+locking\b/gi, 'intent read locking'],
      [/\bin\s+read\s+lock\b/gi, 'intent read lock'],
      [/\btwo\s+phase\s+locking\b/gi, 'two-phase locking'],
      [/\b2\s*p\s*l\b/gi, '2PL'],
      [/\bbios\b/gi, 'BIOS'],
      [/\bb\s*i\s*o\s*s\b/gi, 'BIOS'],
      [/\buefi\b/gi, 'UEFI'],
      [/\bu\s*e\s*f\s*i\b/gi, 'UEFI'],
      [/\b(dock\s*er)\b/gi, 'Docker'],
      [/\b(cube\s*net(?:ties|is))\b/gi, 'Kubernetes'],

      // 13. Languages, Runtimes & Concurrency Internals (zero English collision)
      [/\b(?:c\s*python|see\s*python)\b/gi, 'CPython'],
      [/\b(?:c\s*plus\s*plus|see\s*plus\s*plus)\b/gi, 'C++'],
      [/\b(?:c\s*sharp|see\s*sharp)\b/gi, 'C#'],
      [/\b(?:multi\s*threading|multiple\s*threading)\b/gi, 'multithreading']
      // NOTE: "re act" → React REMOVED (collides with English "react/re-act").
      // NOTE: DCL/TCL/DDL/DML greedy spaced-char matches REMOVED (collide with Tcl language, etc.).
      // NOTE: AML greedy match REMOVED (collides with "a ML model").
      // All handled contextually by the LLM system prompt.
    ];

    for (const [pattern, replacement] of corrections) {
      s = s.replace(pattern, replacement);
    }
    return s;
  }

  function extractResumeIntelligence(text) {
    if (!text || typeof text !== 'string') {
      return { candidateName: 'Candidate', candidateTitle: 'Software Engineer', skills: [], metrics: [] };
    }

    const first500 = text.substring(0, 500);
    const lines = first500.split('\n').map(l => l.trim()).filter(Boolean);
    let candidateName = '';
    let candidateTitle = '';

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      if (/email|phone|github|linkedin|http|@|address|\+?\d{2,}/i.test(line)) continue;
      if (line.length >= 3 && line.length <= 40 && !candidateName) {
        candidateName = line;
        continue;
      }
      if (candidateName && !candidateTitle && line.length >= 4 && line.length <= 60) {
        if (/engineer|architect|developer|lead|scientist|specialist|manager|consultant/i.test(line)) {
          candidateTitle = line;
          break;
        }
      }
    }

    const techVocabulary = [
      'C++', 'Python', 'Go', 'Golang', 'Java', 'Rust', 'TypeScript', 'JavaScript', 'SQL',
      'PostgreSQL', 'Postgres', 'MySQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'K8s',
      'AWS', 'GCP', 'Azure', 'Linux', 'GraphQL', 'gRPC', 'Distributed Systems',
      'Microservices', 'System Design', 'CI/CD', 'Git', 'Next.js', 'React', 'Node.js'
    ];
    const matchedSkills = new Set();
    for (const skill of techVocabulary) {
      let regex;
      if (skill === 'C++') {
        regex = /(?:^|\W)C\+\+(?=\W|$)/i;
      } else if (skill === 'C#') {
        regex = /(?:^|\W)C#(?=\W|$)/i;
      } else {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(`\\b${escaped}\\b`, 'i');
      }
      if (regex.test(text)) {
        let cleanSkill = skill;
        if (cleanSkill.toLowerCase() === 'golang') cleanSkill = 'Go';
        if (cleanSkill.toLowerCase() === 'postgres') cleanSkill = 'PostgreSQL';
        if (cleanSkill.toLowerCase() === 'k8s') cleanSkill = 'Kubernetes';
        matchedSkills.add(cleanSkill);
      }
    }

    const metricsPatterns = [
      /\b(\d+(?:\.\d+)?\s*(?:k|m|b|\%|x|\+)?\s*(?:qps|rps|users|events|requests|transactions|ms|seconds|min|concurrent|uptime|reduction|increase|improvement))\b[^\n\.\;]{0,60}/gi,
      /\b(reduced|increased|improved|scaled|saved|optimized|accelerated|delivered)\b[^\n\.\;]{0,50}\b\d+(?:\.\d+)?(?:\%|x|\+|(?:k|m|b)?\s*(?:qps|rps|users|dollars|\$))?[^\n\.\;]{0,40}/gi
    ];
    const matchedMetrics = new Set();
    for (const pat of metricsPatterns) {
      let match;
      while ((match = pat.exec(text)) !== null) {
        const snippet = match[0].trim().replace(/^[\-\*\•\–\—\s]+/, '').replace(/\s+/g, ' ');
        if (snippet.length >= 10 && snippet.length <= 110) {
          matchedMetrics.add(snippet);
        }
        if (matchedMetrics.size >= 8) break;
      }
    }

    return {
      candidateName: candidateName || 'Candidate',
      candidateTitle: candidateTitle || 'Software Engineer',
      skills: Array.from(matchedSkills).slice(0, 25),
      metrics: Array.from(matchedMetrics).slice(0, 6)
    };
  }

  function extractJobDescriptionIntelligence(text) {
    if (!text || typeof text !== 'string') {
      return { roleTitle: 'Target Engineering Role', companyName: '', skills: [], rawCharCount: 0 };
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let roleTitle = '';
    const titlePrefixRegex = /(?:job\s*title|role|position|opening|title)\s*[:\-–]\s*([^\r\n]+)/i;
    for (let i = 0; i < Math.min(25, lines.length); i++) {
      const m = lines[i].match(titlePrefixRegex);
      if (m && m[1] && m[1].trim().length >= 3 && m[1].trim().length <= 60) {
        roleTitle = m[1].trim();
        break;
      }
    }

    if (!roleTitle) {
      const commonTitleRegex = /(?:senior|staff|principal|lead|junior|associate|director)?\s*(?:software|systems|backend|frontend|full[\s-]stack|cloud|devops|data|ml|ai|site\s*reliability|platform|security|mobile|ios|android|qa)\s*(?:engineer|developer|architect|lead|specialist|manager)/i;
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        const m = lines[i].match(commonTitleRegex);
        if (m) {
          roleTitle = lines[i].length <= 65 ? lines[i] : m[0];
          break;
        }
      }
    }

    let companyName = '';
    const companyPrefixRegex = /(?:company|organization|at|about)\s*[:\-–]\s*([A-Za-z0-9\s\.\,\&]+)/i;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const m = lines[i].match(companyPrefixRegex);
      if (m && m[1] && m[1].trim().length >= 2 && m[1].trim().length <= 40) {
        const cand = m[1].trim();
        if (!/requirements|qualifications|about us|overview|the role/i.test(cand)) {
          companyName = cand;
          break;
        }
      }
    }

    if (!companyName) {
      const aboutRegex = /(?:at|joining|welcome to)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)?)[,\s]/;
      for (let i = 0; i < Math.min(15, lines.length); i++) {
        const m = lines[i].match(aboutRegex);
        if (m && m[1] && m[1].length >= 3 && m[1].length <= 30 && !/software|engineering|the|our|team/i.test(m[1])) {
          companyName = m[1].trim();
          break;
        }
      }
    }

    const techVocabulary = [
      'C++', 'Python', 'Go', 'Golang', 'Java', 'Rust', 'TypeScript', 'JavaScript', 'SQL',
      'PostgreSQL', 'Postgres', 'MySQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'K8s',
      'AWS', 'GCP', 'Azure', 'Linux', 'GraphQL', 'gRPC', 'Distributed Systems',
      'Microservices', 'System Design', 'CI/CD', 'Git', 'Next.js', 'React', 'Node.js'
    ];

    const matchedSkills = new Set();
    for (const skill of techVocabulary) {
      let regex;
      if (skill === 'C++') {
        regex = /(?:^|\W)C\+\+(?=\W|$)/i;
      } else if (skill === 'C#') {
        regex = /(?:^|\W)C#(?=\W|$)/i;
      } else {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(`\\b${escaped}\\b`, 'i');
      }
      if (regex.test(text)) {
        let cleanSkill = skill;
        if (cleanSkill.toLowerCase() === 'golang') cleanSkill = 'Go';
        if (cleanSkill.toLowerCase() === 'postgres') cleanSkill = 'PostgreSQL';
        if (cleanSkill.toLowerCase() === 'k8s') cleanSkill = 'Kubernetes';
        matchedSkills.add(cleanSkill);
      }
    }

    return {
      roleTitle: roleTitle || 'Target Engineering Role',
      companyName: companyName || '',
      skills: Array.from(matchedSkills).slice(0, 18),
      rawCharCount: text.length
    };
  }

  function hasMeaningfulVisualChange(oldBuf, newBuf) {
    if (!oldBuf || !newBuf) return true;
    if (oldBuf.length === 0 || newBuf.length === 0) return true;
    if (oldBuf.equals && oldBuf.equals(newBuf)) return false;

    // Sample 256 evenly spaced points across the buffer
    const samples = 256;
    let mismatches = 0;
    const stepOld = Math.floor(oldBuf.length / samples);
    const stepNew = Math.floor(newBuf.length / samples);
    for (let i = 0; i < samples; i++) {
      if (Math.abs(oldBuf[i * stepOld] - newBuf[i * stepNew]) > 30) {
        mismatches++;
      }
    }
    // Require at least 8% sample difference to distinguish a real page/slide shift from a clock or cursor blink
    return mismatches >= Math.floor(samples * 0.08);
  }

  function normalizeQuestionText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isSameQuestion(q1, q2) {
    const n1 = normalizeQuestionText(q1);
    const n2 = normalizeQuestionText(q2);
    if (!n1 || !n2) return false;
    if (n1 === n2) return true;

    const stopWords = new Set(['a', 'an', 'the', 'for', 'in', 'on', 'at', 'to', 'of', 'and', 'or', 'is', 'it', 'can', 'you', 'please', 'me', 'we']);
    const words1 = n1.split(' ').filter(w => !stopWords.has(w) && w.length > 1);
    const words2 = n2.split(' ').filter(w => !stopWords.has(w) && w.length > 1);
    if (words1.length > 0 && words2.length > 0) {
      const s1 = new Set(words1);
      const s2 = new Set(words2);
      let intersection = 0;
      for (const w of s1) {
        if (s2.has(w)) intersection++;
      }
      const union = new Set([...s1, ...s2]).size;
      const similarity = intersection / union;
      if (similarity >= 0.70) return true;
    }

    // Length-bounded substring check: only matches if one is >= 75% the length of the other (minor suffix/prefix variation)
    const minLen = Math.min(n1.length, n2.length);
    const maxLen = Math.max(n1.length, n2.length);
    if ((minLen / maxLen) >= 0.75 && (n1.includes(n2) || n2.includes(n1))) {
      return true;
    }

    return false;
  }

  function isContinuationClause(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    return /^(where|which|that|when|who|and|specifically|in\s+which|how\s+you|where\s+you|what\s+you|how\s+to|to\s+solve|while|with)\b/i.test(clean);
  }

  function parseCooldownDurationMs(errorMsg) {
    if (!errorMsg || typeof errorMsg !== 'string') return 60000;
    
    // Match patterns like "try again in 1h23m45s" or "try again in 2m30s" or "try again in 45.6s" or "try again in 500ms"
    const tryAgainMatch = errorMsg.match(/try again in\s+([0-9hms\.\s]+)/i);
    if (tryAgainMatch && tryAgainMatch[1]) {
      const timeStr = tryAgainMatch[1].trim();
      let totalMs = 0;
      const hours = timeStr.match(/(\d+(?:\.\d+)?)\s*h/i);
      const minutes = timeStr.match(/(\d+(?:\.\d+)?)\s*m(?!s)/i);
      const seconds = timeStr.match(/(\d+(?:\.\d+)?)\s*s/i);
      const ms = timeStr.match(/(\d+)\s*ms/i);

      if (hours) totalMs += parseFloat(hours[1]) * 3600000;
      if (minutes) totalMs += parseFloat(minutes[1]) * 60000;
      if (seconds) totalMs += parseFloat(seconds[1]) * 1000;
      if (ms) totalMs += parseInt(ms[1], 10);

      if (totalMs > 0) {
        return totalMs + 2000; // 2s safety buffer
      }
    }

    if (/tokens per day|TPD/i.test(errorMsg)) {
      return 15 * 60 * 1000; // 15m cooldown for daily quota limits
    }

    return 60000; // 60s default
  }

  function isRateLimitError(err) {
    if (!err) return false;
    if (err.status === 429 || err.statusCode === 429) return true;
    const msg = String(err.message || err || '').toLowerCase();
    return msg.includes('429') ||
           msg.includes('rate limit') ||
           msg.includes('rate_limit') ||
           msg.includes('too many requests') ||
           msg.includes('tokens per day') ||
           msg.includes('tpd') ||
           msg.includes('tpm');
  }

  class ModelCircuitBreaker {
    constructor() {
      this.cooldowns = new Map();
    }

    recordFailure(model, error) {
      if (!model) return;
      const errMsg = error && error.message ? error.message : String(error || '');
      const durationMs = parseCooldownDurationMs(errMsg);
      const cooldownUntil = Date.now() + durationMs;
      this.cooldowns.set(model, {
        cooldownUntil,
        reason: errMsg,
        durationMs
      });
      return cooldownUntil;
    }

    isAvailable(model) {
      if (!model) return true;
      const entry = this.cooldowns.get(model);
      if (!entry) return true;
      if (Date.now() >= entry.cooldownUntil) {
        this.cooldowns.delete(model);
        return true;
      }
      return false;
    }

    recordSuccess(model) {
      if (model) {
        this.cooldowns.delete(model);
      }
    }

    getPrioritizedCandidates(candidateList) {
      if (!Array.isArray(candidateList) || candidateList.length === 0) return [];
      const unique = [...new Set(candidateList.filter(Boolean))];
      const available = unique.filter(m => this.isAvailable(m));
      if (available.length > 0) {
        return available;
      }
      // If all candidates are in cooldown, return sorted by who recovers earliest
      return unique.sort((a, b) => {
        const timeA = this.cooldowns.get(a)?.cooldownUntil || 0;
        const timeB = this.cooldowns.get(b)?.cooldownUntil || 0;
        return timeA - timeB;
      });
    }

    reset() {
      this.cooldowns.clear();
    }
  }

  function extractLatestQuestionFromTranscript(transcriptText) {
    if (!transcriptText || typeof transcriptText !== 'string') {
      return { targetQuestion: '', priorContext: '' };
    }

    const rawLines = transcriptText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (rawLines.length === 0) {
      return { targetQuestion: '', priorContext: '' };
    }

    if (rawLines.length === 1) {
      return { targetQuestion: rawLines[0], priorContext: '' };
    }

    // Check if the last line is a continuation clause (e.g. "and how do you solve it?", "where you were stuck...")
    const lastLine = rawLines[rawLines.length - 1];
    if (isContinuationClause(lastLine) && rawLines.length >= 2) {
      const merged = `${rawLines[rawLines.length - 2]} ${lastLine}`;
      return {
        targetQuestion: merged,
        priorContext: rawLines.slice(0, -2).join('\n').trim()
      };
    }

    // Search backward from the last line to find the most recent interview question
    let foundQIdx = -1;
    for (let i = rawLines.length - 1; i >= 0; i--) {
      if (isLikelyInterviewQuestion(rawLines[i])) {
        foundQIdx = i;
        break;
      }
    }

    if (foundQIdx !== -1) {
      let targetQuestion = rawLines[foundQIdx];
      let priorLines = rawLines.slice(0, foundQIdx);

      // If the question is preceded by a short conversational lead-in (e.g. "So you mentioned Docker."), prepend it
      if (foundQIdx > 0 && !isLikelyInterviewQuestion(rawLines[foundQIdx - 1]) && !isDeclarativeAnswer(rawLines[foundQIdx - 1])) {
        targetQuestion = `${rawLines[foundQIdx - 1]} ${targetQuestion}`;
        priorLines = rawLines.slice(0, foundQIdx - 1);
      }

      // If there are trailing continuation clauses after foundQIdx, append them
      for (let j = foundQIdx + 1; j < rawLines.length; j++) {
        if (isContinuationClause(rawLines[j])) {
          targetQuestion = `${targetQuestion} ${rawLines[j]}`;
        }
      }

      return {
        targetQuestion: targetQuestion.trim(),
        priorContext: priorLines.join('\n').trim()
      };
    }

    // Fallback: take the last line as target question, all prior lines as prior context
    return {
      targetQuestion: rawLines[rawLines.length - 1],
      priorContext: rawLines.slice(0, -1).join('\n').trim()
    };
  }

  /**
   * Clean Function-Only & Zero-Comment Code Sanitizer
   * Strips comments without breaking string literals, removes boilerplate includes/namespaces/packages,
   * unwraps class Solution boilerplate while strictly preserving custom domain classes (LRUCache, Trie, MinStack),
   * and preserves helper functions and proper indentation.
   */
  function sanitizeInterviewCode(rawCode, language = 'cpp') {
    if (!rawCode || typeof rawCode !== 'string') return '';

    let code = rawCode.trim();

    // 1. Strip markdown fences if present
    code = code.replace(/^```[a-zA-Z0-9_+-]*\r?\n?/, '').replace(/\r?\n?```\s*$/, '');

    // 2. Language-aware comment stripper that strictly preserves comments inside string literals
    const lang = (language || 'cpp').toLowerCase();
    if (lang === 'python') {
      // IMPORTANT: Triple quotes MUST be checked before single/double quotes!
      code = code.replace(/("""[\s\S]*?""")|('''[\s\S]*?''')|("(?:\\[\s\S]|[^"\\])*")|('(?:\\[\s\S]|[^'\\])*')|(#[^\r\n]*)/g, (match, tDStr, tSStr, dStr, sStr, comment) => {
        if (tDStr || tSStr || dStr || sStr) return match;
        return '';
      });
    } else if (lang === 'sql') {
      code = code.replace(/('(?:\\[\s\S]|[^'\\])*')|(\/\*[\s\S]*?\*\/)|(--[^\r\n]*)/g, (match, str, blockComment, lineComment) => {
        if (str) return match;
        return '';
      });
    } else {
      // C++, Java, Go, JS, TS, Rust, C#, Swift
      code = code.replace(/("(?:\\[\s\S]|[^"\\])*")|('(?:\\[\s\S]|[^'\\])*')|(`(?:\\[\s\S]|[^`\\])*`)|(\/(?![*\/])(?:\\[\s\S]|\[(?:\\[\s\S]|[^\]\\])*\]|[^/\n\\])+\/[gimsuy]*)|(\/\*[\s\S]*?\*\/)|(\/\/[^\r\n]*)/g, (match, dStr, sStr, tStr, regexLit, blockComment, lineComment) => {
        if (dStr || sStr || tStr || regexLit) return match;
        return '';
      });
    }

    // 3. Strip preprocessor directives, package statements, and namespace boilerplate
    const lines = code.split(/\r?\n/);
    const cleanLines = lines.filter(line => {
      const trimmed = line.trim();
      if (/^#include\s*[<"][^>"]*[>"]/.test(trimmed)) return false;
      if (/^using\s+namespace\s+std\s*;/.test(trimmed)) return false;
      if (/^#pragma\s+once/.test(trimmed)) return false;
      if (/^package\s+[a-zA-Z0-9_.]+;?/.test(trimmed)) return false;
      if (/^import\s+java\.[a-zA-Z0-9_.*]+;?/.test(trimmed)) return false;
      return true;
    });

    code = cleanLines.join('\n');

    // 4. Unwrap LeetCode `class Solution { public: ... };` or `public class Solution { ... }` or `public class Main { ... }`
    // CRITICAL: Do NOT unwrap domain data structures like `class LRUCache`, `class Trie`, `class MinStack`, `class MedianFinder`!
    const isGenericWrapper = /^\s*(?:public\s+)?class\s+(?:Solution|Main)\b/.test(code);
    if (isGenericWrapper) {
      const classMatch = code.match(/(?:public\s+)?class\s+(?:Solution|Main)\s*\{(?:\s*public\s*:)?([\s\S]*)\}\s*;?\s*$/);
      if (classMatch && classMatch[1] && classMatch[1].trim()) {
        code = classMatch[1];
      }
    }

    // 5. Clean up multiple empty lines & normalize indentation
    const normalizedLines = code.split(/\r?\n/).map(l => l.replace(/\s+$/, ''));
    const filteredLines = [];
    for (let i = 0; i < normalizedLines.length; i++) {
      const line = normalizedLines[i];
      if (line.trim() === '') {
        if (filteredLines.length > 0 && filteredLines[filteredLines.length - 1].trim() !== '') {
          const prev = filteredLines[filteredLines.length - 1].trim();
          if (!prev.endsWith('{') && !prev.endsWith(':')) {
            filteredLines.push('');
          }
        }
      } else {
        filteredLines.push(line);
      }
    }

    return filteredLines.join('\n').trim();
  }

  /**
   * Progression Talking Points Extractor (Webcam Notch Mode teleprompter)
   * bullet1: the full spoken "say this first" line.
   * bullet2: one supporting sentence (bridge insight, failure mechanism, or first talking point).
   * cues: short keywords to talk through: the coding Glance Anchors, or the bold labels of the talking points.
   * All text is free of markdown syntax.
   */
  const NOTCH_SAY_MAX = 400;
  const NOTCH_DETAIL_MAX = 160;
  const NOTCH_CUE_MAX = 34;
  const NOTCH_MAX_CUES = 5;
  // Labels that are not worth a keyword: the coding ladder and debugger steps (bullet2 and the anchors already
  // cover them) and the STAR scaffolding words
  const NOTCH_SKIPPED_LABELS = /^(naive approach|bottleneck|optimization insight|failure mechanism|test case fix|space optimization|key edge cases|(the )?interviewer will likely ask|situation|task|action|result)s?$/i;
  const NOTCH_CUE_KINDS = { brute: 'brute', bridge: 'bridge', core: 'core', trap: 'trap', edge: 'trap' };

  function stripNotchMarkdown(value) {
    return (value || '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/^\s*(?:🗣️?\s*)?(?:say this(?: first)?\s*:\s*)/i, '')
      .replace(/^["'“”‘’*_\s]+|["'“”‘’*_\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function truncateNotchText(value, max) {
    return value.length > max ? value.substring(0, max - 3).trimEnd() + '...' : value;
  }

  function normalizeNotchText(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function isNotchContentLine(line) {
    const trimmed = line.trim();
    return trimmed.length > 3 &&
      !/^(#|>|```|\||---|\*\*\*)/.test(trimmed) &&
      !trimmed.includes('🎯 Recognized Question') &&
      !trimmed.includes(OUTPUT_MARKERS.NO_PROBLEM_DETECTED);
  }

  function extractSpokenQuote(lines) {
    const start = lines.findIndex(line => /^\s*>/.test(line));
    if (start === -1) return '';
    const parts = [];
    for (let i = start; i < lines.length && /^\s*>/.test(lines[i]); i++) {
      parts.push(lines[i].replace(/^\s*>\s*/, ''));
    }
    return stripNotchMarkdown(parts.join(' '));
  }

  function extractNotchCues(clean, lines) {
    const hasLadder = /###\s*🏷️?\s*Glance Anchors/i.test(clean) || /\*\*(Naive Approach|Optimization Insight)\*\*/i.test(clean);
    if (hasLadder) {
      return extractGlanceAnchors(clean).map(anchor => {
        const match = anchor.match(/^(Brute|Bridge|Core|Trap|Edge)\s*:\s*(.+)$/i);
        const label = match ? match[1] : '';
        return {
          label,
          text: truncateNotchText(stripNotchMarkdown(match ? match[2] : anchor), NOTCH_CUE_MAX),
          kind: NOTCH_CUE_KINDS[label.toLowerCase()] || 'core'
        };
      }).filter(cue => cue.text);
    }

    const cues = [];
    let section = '';
    for (const line of lines) {
      const heading = line.match(/^\s*#{1,6}\s*(.+)/);
      if (heading) {
        section = heading[1].toLowerCase();
        continue;
      }
      if (/follow-?up/.test(section)) continue;
      const bullet = line.match(/^\s*(?:[*-]|\d+\.)\s+\*\*([^*]{2,60}?)\*\*/);
      if (!bullet) continue;
      const label = bullet[1].replace(/[:\s]+$/, '').trim();
      if (!label || NOTCH_SKIPPED_LABELS.test(label)) continue;
      const kind = /gotcha|trade-?off|pitfall|trap/.test(section) ? 'trap' : 'point';
      cues.push({ label: '', text: truncateNotchText(stripNotchMarkdown(label), NOTCH_CUE_MAX), kind });
      if (cues.length >= NOTCH_MAX_CUES) break;
    }
    return cues;
  }

  function extractProgressionTalkingPoints(text) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return {
        bullet1: 'Waiting for interview question...',
        bullet2: 'Press ⌥⌘N to restore full HUD',
        cues: []
      };
    }

    const clean = text.trim();
    // Code is never read aloud; an unterminated fence (still streaming) runs to the end
    const lines = clean.replace(/```[\s\S]*?(?:```|$)/g, '').split(/\r?\n/);
    const contentLines = lines.filter(isNotchContentLine).map(line => stripNotchMarkdown(line.replace(/^\s*(?:[*-]|\d+\.)\s+/, '')));

    // 1. The spoken blockquote, or the first plain content line for formats without one
    let bullet1 = extractSpokenQuote(lines) || contentLines[0] || '';

    // 2. Bridge insight / failure mechanism, else the first talking point, else the next distinct line
    const bridgeMatch = clean.match(/\*\*Optimization Insight:?\*\*:?\s*([^\r\n]+)/i) ||
                        clean.match(/\*\*Failure Mechanism:?\*\*:?\s*([^\r\n]+)/i) ||
                        clean.match(/\*\*Naive Approach:?\*\*:?\s*([^\r\n]+)/i) ||
                        clean.match(/###\s*🪜?\s*2️⃣?\s*The Bridge[^\r\n]*\r?\n\s*\*\s*(.+)/i) ||
                        clean.match(/###\s*🎯?\s*Root Cause[^\r\n]*\r?\n\s*\*\s*(.+)/i);
    let bullet2 = bridgeMatch ? stripNotchMarkdown(bridgeMatch[1].replace(/^\*\*[^*]+\*\*:?\s*/, '')) : '';
    if (!bullet2) {
      const sayKey = normalizeNotchText(bullet1);
      bullet2 = contentLines.find(line => {
        const key = normalizeNotchText(line);
        return key && key !== sayKey && !sayKey.startsWith(key);
      }) || '';
    }

    bullet1 = truncateNotchText(bullet1, NOTCH_SAY_MAX);
    bullet2 = truncateNotchText(bullet2, NOTCH_DETAIL_MAX);

    return { bullet1, bullet2, cues: extractNotchCues(clean, lines) };
  }

  /**
   * Glance Anchors Extractor (Sub-300ms Memory Anchor Chips)
   * Extracts compact, high-impact 2-4 word technical chips so candidates
   * can absorb the core architecture/complexity in a 200ms glance without reading full sentences.
   */
  function extractGlanceAnchors(text) {
    if (!text || typeof text !== 'string') return [];

    const clean = text.trim();
    const anchors = [];

    // 1. Direct match for structured Glance Anchors section if present
    const anchorsMatch = clean.match(/###\s*🏷️?\s*Glance Anchors\s*([\s\S]*?)(?=###|```|$)/i);
    if (anchorsMatch && anchorsMatch[1]) {
      const lines = anchorsMatch[1].split(/\r?\n/).filter(l => l.trim().startsWith('*') || l.trim().startsWith('-'));
      for (const line of lines) {
        const parsed = line.replace(/^[\s*-]+/, '').replace(/\*\*/g, '').trim();
        if (parsed) {
          anchors.push(parsed);
        }
      }
      if (anchors.length > 0) return anchors.slice(0, 4);
    }

    // 2. Fallback heuristic extraction from progression ladder
    // A. Brute Anchor
    const bruteMatch = clean.match(/\*\s*\*\*Naive Approach\*\*:\s*([^\r\n]+)/i);
    if (bruteMatch && bruteMatch[1]) {
      const bText = bruteMatch[1].replace(/`Time:\s*O\(([^)]+)\)`\s*\|\s*`Space:\s*O\(([^)]+)\)`/i, 'O($1)');
      const shortBrute = bText.split(/[.,]|in Time:/)[0].trim();
      anchors.push(`Brute: ${shortBrute.substring(0, 32)}`);
    }

    // B. Bridge Anchor
    const bridgeMatch = clean.match(/\*\s*\*\*Optimization Insight\*\*:\s*([^\r\n]+)/i);
    if (bridgeMatch && bridgeMatch[1]) {
      const brText = bridgeMatch[1].replace(/`Time:\s*O\(([^)]+)\)`\s*\|\s*`Space:\s*O\(([^)]+)\)`/i, 'O($1)');
      const shortBridge = brText.split(/[.,]|in Time:/)[0].trim();
      anchors.push(`Bridge: ${shortBridge.substring(0, 36)}`);
    }

    // C. Complexity Anchor
    const complexityMatch = clean.match(/Time:\s*O\([^)]+\)\s*\|\s*Space:\s*O\([^)]+\)/i);
    if (complexityMatch) {
      anchors.push(complexityMatch[0]);
    }

    // D. Edge Trap Anchor
    const edgeMatch = clean.match(/\*\s*\*\*Key Edge Cases\*\*:\s*([^\r\n]+)/i) ||
                      clean.match(/###\s*🎯?\s*Root Cause[^\r\n]*\r?\n\*\s*\*\*Failure Mechanism\*\*:\s*([^\r\n]+)/i);
    if (edgeMatch && edgeMatch[1]) {
      const shortEdge = edgeMatch[1].split(/[.,]/)[0].trim();
      anchors.push(`Trap: ${shortEdge.substring(0, 30)}`);
    }

    return anchors.slice(0, 4);
  }

  // Deepgram keyterm vocabulary. Per Deepgram's guidance, keyterms work best as a focused set of jargon,
  // product names, and acronyms that speech recognition actually mishears. Everyday phrases ("load balancer",
  // "join") are recognized fine without help, and the old 180-term list was silently cut to its first 85,
  // which dropped BCNF, mutex, Kubernetes, UPI, KYC, RBI, webhook, and more.
  const DEEPGRAM_KEYTERMS = [
    // Algorithms & data structures
    'LeetCode', 'Two Sum', 'Big-O', 'Dijkstra', 'Floyd-Warshall', 'Trie', 'deque', 'memoization',
    'LRU cache', 'LFU cache', 'Bloom filter', 'monotonic stack', 'topological sort', 'segment tree', 'union find',
    // Misheard in a live mock interview (Indian English): "radio routing", "bit much", "monitoring cube", "multisage"
    'rate limiting', 'rate limiter', 'bitmask', 'bit masking', 'monotonic queue', 'multiset', 'CDN',
    // Systems & distributed design
    'CAP theorem', 'consistent hashing', 'sharding', 'idempotency', 'idempotent', 'idempotency key',
    'B-tree', 'LSM-tree', 'Raft', 'Paxos', 'gRPC', 'Protobuf', 'GraphQL', 'WebSockets', 'webhook', 'HMAC',
    // Databases
    'PostgreSQL', 'SQLite', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'Elasticsearch', 'ClickHouse',
    'Kafka', 'RabbitMQ', 'NoSQL', 'ACID', 'BCNF', '1NF', '2NF', '3NF', 'MVCC', '2PL',
    // Concurrency, OS & languages
    // UEFI / BIOS were dropped: boosting them turned "CDN" into "UEFI VPN" in a live mock interview
    'mutex', 'semaphore', 'spinlock', 'deadlock', 'goroutine', 'syscall', 'OOPs',
    // Cloud & platform
    'Kubernetes', 'K8s', 'Docker', 'Istio', 'Prometheus',
    // Payments & Indian compliance
    'UPI', 'KYC', 'RBI', 'NPCI', 'DPDP', 'TRAI', 'LangGraph'
  ];

  // Capitalized resume words that are titles, section headers, or months rather than names worth boosting
  const CONTEXT_TERM_STOPLIST = new Set([
    'senior', 'junior', 'staff', 'principal', 'lead', 'backend', 'frontend', 'fullstack', 'full', 'stack', 'software',
    'engineer', 'engineering', 'developer', 'manager', 'intern', 'architect', 'skills', 'experience', 'education',
    'projects', 'project', 'summary', 'profile', 'technical', 'technologies', 'tools', 'languages', 'certifications',
    'university', 'college', 'bachelor', 'master', 'present', 'company', 'team',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'
  ]);

  /**
   * Picks the candidate-specific names worth boosting from resume/project text (project names, products,
   * acronyms, mixed-case tech like LangGraph or Node.js), never plain words or the candidate's own name.
   */
  function selectContextKeyterms(contextText, exclude = [], max = 12) {
    const seen = new Set(exclude.map(t => t.toLowerCase()));
    const terms = [];
    let lines = String(contextText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // A resume's first line is usually the candidate's name: the interviewer rarely says it
    if (lines.length && /^[A-Z][a-z]+(?:\s+[A-Z][a-z.]+){0,3}$/.test(lines[0])) lines = lines.slice(1);
    for (const line of lines) {
      const words = line.split(/[^A-Za-z0-9+#.\-]+/).filter(Boolean);
      words.forEach((raw, i) => {
        const t = raw.replace(/^[.\-]+|[.\-]+$/g, '');
        const lower = t.toLowerCase();
        if (terms.length >= max || t.length < 2 || t.length > 24 || seen.has(lower) || CONTEXT_TERM_STOPLIST.has(lower)) return;
        const technical = /[a-z][A-Z]/.test(t) || (/^[A-Z0-9]{2,6}$/.test(t) && /[A-Z]/.test(t)) || /[+#]|\.js$/i.test(t);
        // Capitalized mid-line words are names (projects, companies, products); line-initial words are usually verbs
        const properNoun = i > 0 && /^[A-Z][a-z]{2,}$/.test(t);
        if (technical || properNoun) {
          seen.add(lower);
          terms.push(t);
        }
      });
    }
    return terms;
  }

  const VOCAB_PARAMS_MAX_CHARS = 2300;

  function buildDeepgramVocabularyParams(modelName = 'nova-3', contextText = '') {
    // Built-in terms first; resume names are added on top and can never push a built-in term out
    const allTerms = [...DEEPGRAM_KEYTERMS, ...selectContextKeyterms(contextText, DEEPGRAM_KEYTERMS)];

    // No Deepgram-side find-and-replace: sanitizeTechnicalTranscript applies the full homophone dictionary to every
    // mic and Meet line before display and Auto-Pilot, so sending a copy in the URL only crowded out resume terms

    // Nova-3 Keyterm Prompting (plain contextual terms); Nova-2 legacy keyword boosting with a gentle 1.2 weight
    const termParam = modelName === 'nova-3'
      ? (k) => `keyterm=${encodeURIComponent(k)}`
      : (k) => `keywords=${encodeURIComponent(k)}:1.2`;

    // Built-ins always fit; resume terms fill the rest up to the 85-term cap and a proxy-safe URL
    // (the ~160-char base params plus this stay under 2.5 KB)
    const params = [];
    let length = 0;
    for (const term of allTerms.slice(0, 85)) {
      const param = termParam(term);
      if (params.length >= DEEPGRAM_KEYTERMS.length && length + param.length + 1 > VOCAB_PARAMS_MAX_CHARS) break;
      params.push(param);
      length += param.length + 1;
    }

    return params.join('&');
  }

  /**
   * Query string for Deepgram's live /v1/listen socket: model, formatting, turn detection, and vocabulary.
   * Shared by the mic and tab-audio sockets so both always use identical settings.
   */
  function buildDeepgramListenQuery({ model = 'nova-3', diarize = false, contextText = '' } = {}) {
    return `model=${model}&language=en&smart_format=true&punctuate=true&numerals=true&interim_results=true&endpointing=600&utterance_end_ms=1200&vad_events=true&diarize=${diarize}&${buildDeepgramVocabularyParams(model, contextText)}`;
  }

  /**
   * Output markers shared by the prompt builder (lib/prompts.js) and the renderer's stream parsers.
   * Prompts and parsers must reference these constants, never re-typed literals.
   */
  const OUTPUT_MARKERS = {
    // Auto-Watch sentinel: the model answers exactly this when no problem is visible on screen
    NO_PROBLEM_DETECTED: '[NO_PROBLEM_DETECTED]',
    // Optional reconstructed-question line in the adaptive prompt: **🎯 Recognized Question:** ...
    RECOGNIZED_QUESTION: '🎯 Recognized Question:'
  };

  /**
   * Extracts the model's reconstructed question (OUTPUT_MARKERS.RECOGNIZED_QUESTION line), or ''.
   */
  function extractRecognizedQuestion(text) {
    if (!text || typeof text !== 'string') return '';
    const match = text.match(/(?:\*\*🎯 Recognized Question:\*\*|🎯 Recognized Question:?)\s*(.+?)(?:\n|>|$)/i);
    if (!match || !match[1]) return '';
    return match[1].trim().replace(/^\[|\]$/g, '').trim();
  }

  return {
    buildDeepgramListenQuery,
    DEEPGRAM_KEYTERMS,
    OUTPUT_MARKERS,
    extractRecognizedQuestion,
    isCandidateHonorificAddress,
    isDeclarativeAnswer,
    isLikelyInterviewQuestion,
    isFollowUpQuestion,
    isCodingQuestion,
    isSameQuestion,
    isContinuationClause,
    extractLatestQuestionFromTranscript,
    parseCooldownDurationMs,
    isRateLimitError,
    ModelCircuitBreaker,
    sanitizeTechnicalTranscript,
    extractResumeIntelligence,
    extractJobDescriptionIntelligence,
    hasMeaningfulVisualChange,
    sanitizeInterviewCode,
    extractProgressionTalkingPoints,
    extractGlanceAnchors
  };
});

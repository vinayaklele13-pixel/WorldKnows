import { SearchResultData } from '@/types/search';

export const mockSearchResults: Record<string, SearchResultData> = {
  'where is india': {
    query: 'Where is India?',
    normalizedQuery: 'where is india',
    intent: 'DEFINITION',
    quickAnswer: 'India is located in South Asia, occupying the major portion of the Indian subcontinent. It is bounded by the Indian Ocean on the south, the Arabian Sea on the southwest, and the Bay of Bengal on the southeast. It shares land borders with Pakistan to the northwest; China, Nepal, and Bhutan to the north; and Bangladesh and Myanmar to the east [1].',
    keyFacts: [
      { label: 'Geographic Region', value: 'South Asia' },
      { label: 'Coordinates', value: '20.5937° N, 78.9629° E' },
      { label: 'Capital', value: 'New Delhi' },
      { label: 'Neighboring Nations', value: 'China, Pakistan, Nepal, Bhutan, Bangladesh, Myanmar' },
      { label: 'Coastline', value: '7,516.6 km along the Indian Ocean basin' }
    ],
    detailedSections: [
      {
        title: 'Geographic Boundaries & Location',
        content: 'India constitutes the core of the Indian subcontinent in South Asia. Spanning over 3.287 million square kilometers, it is the seventh-largest country by land area and the most populous nation globally.'
      },
      {
        title: 'Strategic Regional Position',
        content: 'Positioned at the crossroads of major maritime trade routes in the Indian Ocean, India holds critical geostrategic importance connecting West Asia, Southeast Asia, and Central Asia.'
      }
    ],
    sources: [
      {
        id: 'src-india-1',
        title: 'The World Factbook: India',
        domain: 'cia.gov',
        url: 'https://www.cia.gov/the-world-factbook/countries/india/',
        publisher: 'Central Intelligence Agency',
        sourceType: 'GOVERNMENT',
        reliabilityScore: 0.99,
        excerpt: 'Authoritative geographic, geopolitical, and demographic profile of the Republic of India.'
      },
      {
        id: 'src-india-2',
        title: 'Encyclopædia Britannica: India Geography',
        domain: 'britannica.com',
        url: 'https://www.britannica.com/place/India',
        publisher: 'Encyclopædia Britannica',
        sourceType: 'REFERENCE',
        reliabilityScore: 0.97,
        excerpt: 'Detailed scholarly overview of India’s physical geography, climate, and boundaries.'
      }
    ],
    relatedTopics: [
      'Indian Subcontinent',
      'Geography of South Asia',
      'Indian Ocean Maritime Routes',
      'Borders of India'
    ],
    isMock: true
  },
  'what is quantum computing': {
    query: 'What is quantum computing?',
    normalizedQuery: 'what is quantum computing',
    intent: 'SCIENTIFIC',
    quickAnswer: 'Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers. By utilizing qubits that can exist in superposition states, quantum computers perform calculations exponentially faster for specific cryptographic, simulation, and optimization tasks [1].',
    keyFacts: [
      { label: 'Core Principle', value: 'Superposition & Entanglement' },
      { label: 'Basic Unit', value: 'Qubit (Quantum Bit)' },
      { label: 'Primary Advantage', value: 'Exponential parallel processing' },
      { label: 'First Theorized', value: 'Early 1980s (Richard Feynman, David Deutsch)' },
      { label: 'Major Players', value: 'IBM, Google, Rigetti, IonQ' }
    ],
    detailedSections: [
      {
        title: 'How Qubits Differ from Classical Bits',
        content: 'While classical computers encode information in bits that represent either a 0 or a 1, quantum bits (qubits) can exist in a linear combination of states known as superposition. This allows quantum processors to evaluate vast combinations of possibilities simultaneously.'
      },
      {
        title: 'Entanglement and Interference',
        content: 'Quantum entanglement links qubits in such a way that the state of one instantly influences another, regardless of distance. Quantum interference is then used to amplify correct calculation paths while canceling out incorrect ones.'
      },
      {
        title: 'Key Applications',
        content: 'Primary use cases include molecular modeling for drug discovery, optimizing global logistics networks, materials science, and breaking legacy public-key cryptography (Post-Quantum Cryptography).'
      }
    ],
    sources: [
      {
        id: 'src-1',
        title: 'Quantum Computation and Quantum Information',
        domain: 'cambridge.org',
        url: 'https://www.cambridge.org/quantum-computing',
        publisher: 'Cambridge University Press',
        sourceType: 'ACADEMIC',
        reliabilityScore: 0.98,
        excerpt: 'Comprehensive foundational text on quantum mechanics and qubit mechanics.'
      },
      {
        id: 'src-2',
        title: 'IBM Quantum Information Research',
        domain: 'ibm.com',
        url: 'https://www.ibm.com/quantum',
        publisher: 'IBM Research',
        sourceType: 'REFERENCE',
        reliabilityScore: 0.95,
        excerpt: 'Overview of superconducting qubits, error correction, and quantum utility.'
      },
      {
        id: 'src-3',
        title: 'NIST Post-Quantum Cryptography Standardization',
        domain: 'nist.gov',
        url: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
        publisher: 'National Institute of Standards and Technology',
        sourceType: 'GOVERNMENT',
        reliabilityScore: 0.99,
        excerpt: 'Government standards for secure encryption resistant to quantum algorithms.'
      }
    ],
    relatedTopics: [
      'Quantum Entanglement',
      'Qubit Error Correction',
      'Post-Quantum Cryptography',
      'Superconducting Circuits',
      'Shor Algorithm'
    ],
    isMock: true
  },
  'history of the mughal empire': {
    query: 'History of the Mughal Empire',
    normalizedQuery: 'history of the mughal empire',
    intent: 'HISTORICAL',
    quickAnswer: 'The Mughal Empire was an early modern empire in South Asia that existed from 1526 to 1857. Founded by Babur, a warrior chieftain from Central Asia, the empire at its zenith ruled over most of the Indian subcontinent, fostering immense economic prosperity, administrative centralization, and a rich synthesis of Persian, Islamic, and Indian arts and architecture [1].',
    keyFacts: [
      { label: 'Founded', value: '1526 (Battle of Panipat)' },
      { label: 'Founder', value: 'Babur' },
      { label: 'Peak Emperor', value: 'Akbar the Great, Shah Jahan, Aurangzeb' },
      { label: 'Capital Cities', value: 'Agra, Delhi, Lahore, Fatehpur Sikri' },
      { label: 'Dissolution', value: '1857 (British Crown takeover)' }
    ],
    detailedSections: [
      {
        title: 'Foundation and Expansion (Babur & Humayun)',
        content: 'Babur defeated Ibrahim Lodi at the First Battle of Panipat in 1526 using advanced artillery and cavalry tactics. His son Humayun faced setbacks but stabilized the dynasty, laying groundwork for institutional governance.'
      },
      {
        title: 'The Golden Age (Akbar, Jahangir, Shah Jahan)',
        content: 'Akbar introduced religious tolerance (Din-i Ilahi), efficient revenue collection (Mansabdari system), and patronized culture. Shah Jahan built architectural marvels including the Taj Mahal, Red Fort, and Jama Masjid.'
      },
      {
        title: 'Decline and Fall',
        content: 'Following Aurangzeb’s prolonged military campaigns and centralization pressures, the empire fragmented. Regional powers rose, culminating in East India Company hegemony and the formal end in 1857.'
      }
    ],
    sources: [
      {
        id: 'src-mughal-1',
        title: 'The Mughal Empire: New Cambridge History of India',
        domain: 'cambridge.org',
        url: 'https://www.cambridge.org/core/books/mughal-empire',
        publisher: 'Cambridge University Press',
        sourceType: 'ACADEMIC',
        reliabilityScore: 0.98,
        excerpt: 'Definitive historical analysis of Mughal political economy and state formation.'
      },
      {
        id: 'src-mughal-2',
        title: 'Ain-i-Akbari (Primary Chronicle)',
        domain: 'columbia.edu',
        url: 'https://www.columbia.edu/itc/mealac/pritchett/00routes/data/b16/ain.html',
        publisher: 'Columbia University South Asia Archive',
        sourceType: 'ACADEMIC',
        reliabilityScore: 0.97,
        excerpt: '16th-century detailed document recording administration under Emperor Akbar.'
      }
    ],
    relatedTopics: [
      'Akbar the Great',
      'Shah Jahan & Taj Mahal',
      'Battle of Panipat',
      'Mansabdari System',
      'Maratha Empire'
    ],
    isMock: true
  }
};

export const defaultMockResult: SearchResultData = {
  query: 'Universal Knowledge',
  normalizedQuery: 'universal knowledge',
  intent: 'DEFINITION',
  quickAnswer: 'WorldKnows provides comprehensive, verified, and structured intelligence across millions of topics. Your query has been successfully indexed and analyzed through our retrieval pipeline.',
  keyFacts: [
    { label: 'Platform', value: 'WorldKnows Knowledge Engine' },
    { label: 'Architecture', value: 'Modular Retrieval & Verification' },
    { label: 'Status', value: 'Frontend Development Mode' },
    { label: 'Verification', value: 'Multi-source cross-checked' }
  ],
  detailedSections: [
    {
      title: 'About This Result',
      content: 'This is a structured preview result generated in the WorldKnows frontend development environment. In production, this view integrates dynamic intent classification, live search APIs, and OmniRoute LLM synthesis.'
    },
    {
      title: 'Explore Further',
      content: 'Use the follow-up questions or related topic chips below to dive deeper into specific sub-dimensions of your inquiry.'
    }
  ],
  sources: [
    {
      id: 'src-default-1',
      title: 'WorldKnows Architecture Specification',
      domain: 'worldknows.internal',
      url: 'https://worldknows.internal/docs',
      publisher: 'WorldKnows Engineering',
      sourceType: 'REFERENCE',
      reliabilityScore: 0.95,
      excerpt: 'Internal system architecture guidelines for high-trust information discovery.'
    }
  ],
  relatedTopics: [
    'Artificial Intelligence',
    'Quantum Computing',
    'History of Science',
    'Global Economics',
    'Cybersecurity'
  ],
  isMock: true
};

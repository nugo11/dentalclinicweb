const GEO_PAIRS = [
  ["zh", "ჟ"],
  ["gh", "ღ"],
  ["sh", "შ"],
  ["ch", "ჩ"],
  ["Ch", "ჭ"],
  ["Ts", "წ"],
  ["ts", "ც"],
  ["dz", "ძ"],
  ["kh", "ხ"],
  ["a", "ა"],
  ["b", "ბ"],
  ["g", "გ"],
  ["d", "დ"],
  ["e", "ე"],
  ["v", "ვ"],
  ["z", "ზ"],
  ["t", "თ"],
  ["i", "ი"],
  ["k", "კ"],
  ["l", "ლ"],
  ["m", "მ"],
  ["n", "ნ"],
  ["o", "ო"],
  ["p", "პ"],
  ["r", "რ"],
  ["s", "ს"],
  ["u", "უ"],
  ["f", "ფ"],
  ["q", "ქ"],
  ["y", "ყ"],
  ["j", "ჯ"],
  ["h", "ჰ"],
  ["R", "ღ"],
  ["T", "თ"],
  ["W", "ჭ"],
  ["S", "შ"],
  ["C", "ჩ"],
  ["Z", "ძ"],
  ["J", "ჟ"],
];

export const transliterateToGeorgian = (text = "") => {
  let result = "";
  let i = 0;

  while (i < text.length) {
    let matched = false;
    for (const [latin, geo] of GEO_PAIRS) {
      if (text.startsWith(latin, i)) {
        result += geo;
        i += latin.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += text[i];
      i += 1;
    }
  }

  return result;
};

export const transliterateToLatin = (text = "") => {
  const GEO_TO_LATIN = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k',
    'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u',
    'ფ': 'p', 'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch',
    'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
  };

  return text.split('').map(char => GEO_TO_LATIN[char] || char).join('');
};

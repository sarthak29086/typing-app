const originalText = "Success is often described as the achievement of a goal, but its meaning can be different for each person. For some, success may mean excelling in education, while for others it may involve building a career, supporting a family, or contributing to";
const typedText = "Success is often described  as the achivement of a goatl, but its meaning can can be different for each person. For some, success may excelling in education, while , for others it may. involve building a Career supporting a family, o";

const alignWords = (original, typed) => {
    const dp = Array(original.length + 1).fill(null).map(() => Array(typed.length + 1).fill(0));
    
    for (let i = 0; i <= original.length; i++) dp[i][0] = i;
    for (let j = 0; j <= typed.length; j++) dp[0][j] = j;
    
    for (let i = 1; i <= original.length; i++) {
      for (let j = 1; j <= typed.length; j++) {
        if (original[i-1] === typed[j-1]) {
          dp[i][j] = dp[i-1][j-1];
        } else {
          dp[i][j] = Math.min(
            dp[i-1][j] + 1,    // omission
            dp[i][j-1] + 1,    // addition
            dp[i-1][j-1] + 1   // substitution
          );
        }
      }
    }
    
    let i = original.length;
    let j = typed.length;
    
    let wrongSpelling = 0;
    let extraWord = 0;
    let lessWord = 0;
    let punctuationError = 0;
    let caseError = 0;
    let spaceDisparity = 0;

    let wrongSpellingDetails = [];
    let extraWordDetails = [];
    let lessWordDetails = [];
    let punctuationErrorDetails = [];
    let caseErrorDetails = [];
    let spaceDisparityDetails = [];
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && original[i-1] === typed[j-1]) {
        i--;
        j--;
      } else {
        const omitScore = i > 0 ? dp[i-1][j] : Infinity;
        const addScore = j > 0 ? dp[i][j-1] : Infinity;
        const subScore = (i > 0 && j > 0) ? dp[i-1][j-1] : Infinity;
        
        const minScore = Math.min(omitScore, addScore, subScore);
        if (minScore === subScore) {
          const orig = original[i-1];
          const typ = typed[j-1];
          const origClean = orig.replace(/[.,/#!$%^&*;:{}=\-_`~()'"?]/g, "");
          const typClean = typ.replace(/[.,/#!$%^&*;:{}=\-_`~()'"?]/g, "");
          
          if (orig.toLowerCase() === typ.toLowerCase()) {
            caseError++;
            caseErrorDetails.unshift({ expected: orig, typed: typ });
          } else if (origClean === typClean) {
            punctuationError++;
            punctuationErrorDetails.unshift({ expected: orig, typed: typ });
          } else if (origClean.toLowerCase() === typClean.toLowerCase()) {
            caseError++;
            punctuationError++;
            caseErrorDetails.unshift({ expected: orig, typed: typ });
            punctuationErrorDetails.unshift({ expected: orig, typed: typ });
          } else {
            wrongSpelling++;
            wrongSpellingDetails.unshift({ expected: orig, typed: typ });
          }
          i--;
          j--;
        } else if (minScore === omitScore) {
          lessWord++;
          lessWordDetails.unshift({ expected: original[i-1], typed: '-' });
          i--;
        } else {
          const typ = typed[j-1];
          if (typ === "") {
            spaceDisparity++;
            spaceDisparityDetails.unshift({ expected: '-', typed: '(extra space)' });
          } else {
            extraWord++;
            extraWordDetails.unshift({ expected: '-', typed: typ });
          }
          j--;
        }
      }
    }
    
    const totalErrors = wrongSpelling + extraWord + lessWord + punctuationError + caseError + spaceDisparity;
    return { 
      wrongSpelling, extraWord, lessWord, punctuationError, caseError, spaceDisparity, totalErrors,
      caseErrorDetails, punctuationErrorDetails
    };
  };

const cleanTypedText = typedText.replace(/\r?\n/g, ' ');
const cleanTargetText = originalText.replace(/\r?\n/g, ' ');
const typedWords = cleanTypedText.split(' ');
const originalWords = cleanTargetText.split(' ');
const alignment = alignWords(originalWords.slice(0, typedWords.length), typedWords);
console.log(alignment);

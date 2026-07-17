// Reproduce the exact user scenario
const originalParagraph = `The practical application of color harmony principles extends across all visual disciplines. In interior design, harmonious color schemes create cohesive environments with desired psychological effects. In branding and marketing, carefully selected color relationships establish recognition and communicate brand values. In user interface design, appropriate color relationships enhance usability and information hierarchy. In fine art, painters leverage these relationships to create depth, movement, and emotional resonance. The concept of harmony in color theory reflects a balance between unity and variety, between predictable patterns that create coherence and unexpected combinations that create interest a balance that ultimately determines whether a color composition feels satisfying and effective or discordant and confusing to the viewer.Color mixing occurs through two fundamentally different processes additive and subtractive each operating according to distinct principles and applicable in different contexts. Additive color mixing involves combining colored light, where the primary colors are red, green, and blue (RGB). When all three are combined at full intensity, they produce white light; the absence of all three results in black. This system is based on how the human eye perceives color through the stimulation of cone cells sensitive to these three wavelength ranges. Additive mixing powers virtually all electronic displays, from smartphone screens to television monitors and digital projectors. Each pixel in`;

const typedText = `The practica application of color harmony principles extends across all visual disciplines. In interior deaign, harmonious color schemes create conesive environments with desired psychological effects. In branding and marketing, carefully celected color relatioinships establish recognition and communicate brand values. In user interface design, appropriate color relatioinships enhance usability and information hierarchy. In fine art, painters leverage these relationships to create depth, movement, and emotional resomance. The concept of harmony in color theory reflects a balance berween unity and variety, berween prdictable patterns that create coherence and unexpected combinations that create interest a balance that ultimately determines whether a color composition feels satisfying and effectve oer discoedant and confusing to the viewer. Xolor mixing occurs througjh two fundamentally different processes additive and subtractive each operationg according to distinct principlesl and applicable in differnent contexts. Additive solor micing involves combining =colored light, where the primary colors are red, green, adn blur (RGb). When all three are combined at full intensity, they produce white light' the absence of all these three wavelength ranges. Additive mixing powers virtually all electronic displays, from smartphome screens ro television monitors and digital projectors. Each pixel in these devices contains red, green, and blue light-emitting components that, when activated in various conbinations and intensities, can reproduce millions of c`;

const cleanTypedText = typedText.replace(/\r?\n/g, ' ').trim();
const baseParagraph = originalParagraph.replace(/\s+/g, ' ').trim();

const typedWords = cleanTypedText.split(/\s+/).filter(w => w.length > 0);
const baseWords = baseParagraph.split(/\s+/).filter(w => w.length > 0);

console.log(`typedWords.length = ${typedWords.length}`);
console.log(`baseWords.length = ${baseWords.length}`);
console.log(`\nFirst 3 typed words: ${typedWords.slice(0, 3).join(', ')}`);
console.log(`Last 3 typed words: ${typedWords.slice(-3).join(', ')}`);
console.log(`\nFirst 3 base words: ${baseWords.slice(0, 3).join(', ')}`);
console.log(`Last 3 base words: ${baseWords.slice(-3).join(', ')}`);

// Simulate what endTest does for original display
const attemptedTargetText = baseWords.slice(0, Math.min(typedWords.length, baseWords.length)).join(' ');
console.log(`\nattemptedTargetText word count: ${attemptedTargetText.split(' ').length}`);
console.log(`Last 5 words of original shown: ${baseWords.slice(Math.min(typedWords.length, baseWords.length) - 5, Math.min(typedWords.length, baseWords.length)).join(', ')}`);
console.log(`\nDoes typed go BEYOND original? ${typedWords.length > baseWords.length ? 'YES - user typed MORE words than original has' : 'NO'}`);

// Key: show what words align at the boundary
const boundary = Math.min(typedWords.length, baseWords.length);
console.log(`\nWord at boundary in ORIGINAL (index ${boundary-1}): "${baseWords[boundary-1]}"`);
console.log(`Word at boundary in TYPED   (index ${boundary-1}): "${typedWords[boundary-1]}"`);

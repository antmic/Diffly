export const validator = (input, word) => {
	let resultArr = [];
	const inputArr = Array.from(input);
	const wordArr = Array.from(word);
	const wordSet = new Set(wordArr);

	function hideLetterFrom(arr, index) {
		arr.splice(index, 1, '#');
	}

	function populateResultArr(input) {
		Array.from(input).forEach((letter, index) => {
			resultArr.push({
				index: index,
				letter: letter,
				isPossible: false,
				isUsed: false,
				isFirst: false,
				isLast: false,
				isCorrectOrder: false,
				isInSequence: false,
				isFirstInSequence: false,
				isLastInSequence: false,
				sequenceId: null,
				priority: 0,
			});
		});
	}

	function getPossibleLetters(inputArr, wordSet, resultArr) {
		const result = inputArr.filter((letter, index) => {
			if (wordSet.has(letter)) {
				resultArr[index].isPossible = true;
				return true;
			}
		});
		return result;
	}

	function getPossibleUniqueLetters(possibleLetters, wordArr) {
		const localWordArr = wordArr.slice();
		const result = possibleLetters.filter(letter => {
			if (localWordArr.indexOf(letter) !== -1) {
				localWordArr.splice(localWordArr.indexOf(letter), 1);
				return true;
			}
		});
		return result;
	}

	function getMatchingIndices(letter, arr) {
		const indices = arr.reduce((acc, l, index) => {
			if (l === letter) {
				acc.push(index);
			}
			return acc;
		}, []);
		return indices;
	}

	function longestCommonSubstring(str1, str2) {
		let matrix = Array(str1.length + 1)
			.fill(null)
			.map(() => Array(str2.length + 1).fill(0));
		let maxLength = 0;
		let end = 0;

		for (let i = 1; i <= str1.length; i++) {
			for (let j = 1; j <= str2.length; j++) {
				if (str1[i - 1] === str2[j - 1]) {
					matrix[i][j] = matrix[i - 1][j - 1] + 1;
					if (matrix[i][j] > maxLength) {
						maxLength = matrix[i][j];
						end = i - 1;
					}
				}
			}
		}

		return str1.slice(end - maxLength + 1, end + 1);
	}

	const getAllSubstrings = (input, word) => {
		let substrings = [];
		let newInput = input.slice();
		let newWord = word.slice();
		(function _getAllSubstrings() {
			let substr1 = longestCommonSubstring(newInput, newWord);
			newInput = newInput.replace(substr1, '');
			if (substr1.length <= 1) {
				return;
			} else {
				substrings.push(substr1);
				_getAllSubstrings();
			}
		})();
		return substrings;
	};

	const getAllMatches = (string, substring) => {
		let result = [];
		const windowSize = substring.length;
		for (let i = 0; i < string.length - windowSize + 1; i++) {
			let window = string.slice(i, i + windowSize);
			if (window === substring) {
				result.push([i, i + windowSize]);
			}
		}
		return result;
	};

	function getSequences(input, word, resultArr) {
		const substrings = getAllSubstrings(input, word);
		const uniqueSubstrings = Array.from(new Set(substrings));

		function getSubstrings(string, uniqueSubstringsArr) {
			let substringsInString = new Map();
			uniqueSubstringsArr.forEach(substring => {
				substringsInString.set(substring, new Map());
				substringsInString.get(substring).set('indices', getAllMatches(string, substring));
				substringsInString.get(substring).set('length', getAllMatches(string, substring).length);
			});
			return substringsInString;
		}

		const substringsInInput = getSubstrings(input, uniqueSubstrings);
		const substringsInWord = getSubstrings(word, uniqueSubstrings);

		function getChosenIndices(substringsInWord, substringsInInput, resultArr) {
			let result = [];
			substringsInWord.forEach((value, key) => {
				const maxNumberOfMatches = Math.min(
					substringsInWord.get(key).get('length'),
					substringsInInput.get(key).get('length')
				);

				const indicesArr = substringsInInput.get(key).get('indices');

				let ranges = [];
				indicesArr.forEach(index => {
					const range = Array.from({ length: index[1] - index[0] }, (_, i) => i + index[0]);
					if (range.length > 1) {
						let prioritySum = 0;
						range.forEach(index => {
							prioritySum += resultArr[index].priority;
						});
						ranges.push(
							new Map([
								['range', range],
								['prioritySum', prioritySum],
							])
						);
					}
				});

				const topNMatches = ranges.sort((a, b) => {
					return b.get('prioritySum') - a.get('prioritySum');
				});

				const chosenMatches = topNMatches.slice(0, maxNumberOfMatches);
				chosenMatches.forEach(match => {
					result.push(match.get('range'));
				});
			});
			return result;
		}
		const chosenIndices = getChosenIndices(substringsInWord, substringsInInput, resultArr);

		function getUniqueChosenIndices(chosenIndices) {
			const result = chosenIndices.filter((element, index) => {
				let isOverlapping = false;
				chosenIndices.forEach((otherElement, otherIndex) => {
					if (index !== otherIndex) {
						if (element.every(index => otherElement.includes(index))) {
							isOverlapping = true;
						}
					}
				});
				return !isOverlapping;
			});
			return result;
		}

		const uniqueChosenIndices = getUniqueChosenIndices(chosenIndices);

		let sequenceId = 0;
		uniqueChosenIndices.forEach(element => {
			element.forEach((index, i) => {
				if (i === 0) {
					resultArr[index].isFirstInSequence = true;
					resultArr[index].isInSequence = true;
					resultArr[index].priority += 2;
					resultArr[index].sequenceId = sequenceId;
				} else if (i === element.length - 1) {
					resultArr[index].isLastInSequence = true;
					resultArr[index].isInSequence = true;
					resultArr[index].priority += 2;
					resultArr[index].sequenceId = sequenceId;
					sequenceId++;
				} else {
					resultArr[index].isInSequence = true;
					resultArr[index].priority += 2;
					resultArr[index].sequenceId = sequenceId;
				}
			});
		});
	}

	function checkFirstLetter(resultArr, word) {
		const firstLetter = resultArr[0];
		if (firstLetter.letter === word[0]) {
			firstLetter.isFirst = true;
			firstLetter.priority += 3;
		}
	}

	function checkLastLetter(resultArr, word) {
		const lastLetter = resultArr[resultArr.length - 1];
		if (lastLetter.letter === word[word.length - 1]) {
			lastLetter.isLast = true;
			lastLetter.priority += 3;
		}
	}

	function checkOrder(resultArr, word) {
		const usedLetters = resultArr.filter(letter => letter.isUsed);
		let tempWord = word;
		usedLetters.forEach(letter => {
			if (letter.isInSequence) {
				if (letter.isFirstInSequence) {
					const sequence = resultArr.filter(l => l.sequenceId === letter.sequenceId);
					const sequenceLetters = sequence.map(l => l.letter).join('');
					if (tempWord.indexOf(sequenceLetters) !== -1) {
						sequence.forEach(l => {
							resultArr[l.index].isCorrectOrder = true;
						});
						tempWord = tempWord.slice(tempWord.indexOf(sequenceLetters) + sequenceLetters.length);
					}
				}
			} else if (tempWord.indexOf(letter.letter) !== -1) {
				resultArr[letter.index].isCorrectOrder = true;
				tempWord = tempWord.slice(tempWord.indexOf(letter.letter) + 1);
			}
		});

		// handle edge case when last letter is correct but ends up as not in correct order
		if (resultArr[resultArr.length - 1].isLast && !resultArr[resultArr.length - 1].isCorrectOrder) {
			const lastLetter = resultArr[resultArr.length - 1];
			const lastLetterIndex = resultArr[resultArr.length - 1].index;
			// get previous letter matching last letter
			const previousLetter = resultArr
				.slice(0, lastLetterIndex)
				.reverse()
				.find(letter => letter.letter === lastLetter.letter && letter.isCorrectOrder);
			previousLetter.isCorrectOrder = false;
			lastLetter.isCorrectOrder = true;
		}
	}

	function getUsedLetters(possibleUniqueLetters, inputArr) {
		possibleUniqueLetters.forEach(letter => {
			const indices = getMatchingIndices(letter, inputArr);
			const sortedIndices = indices.sort((a, b) => {
				return resultArr[b].priority - resultArr[a].priority;
			});
			resultArr[sortedIndices[0]].isUsed = true;
			hideLetterFrom(inputArr, sortedIndices[0]);
		});
	}

	function confirmFirstInSequence(resultArr, word) {
		const firstLetter = resultArr[0];
		if (firstLetter.isInSequence) {
			// is sequences end index in word is the same as last letter index
			let sequence = resultArr
				.filter(l => l.sequenceId === firstLetter.sequenceId)
				.map(l => l.letter)
				.join('');
			const matches = getAllMatches(word, sequence);

			// check if any of the matches end at the index of the last letter in word
			const isTrulyFirst = matches.some(match => match[1] === 0);
			if (isTrulyFirst) {
				firstLetter.isFirst = true;
			} else {
				firstLetter.isFirst = false;
			}
		}
	}

	function confirmLastInSequence(resultArr, word) {
		const lastLetter = resultArr[resultArr.length - 1];
		if (lastLetter.isInSequence) {
			// is sequences end index in word is the same as last letter index
			let sequence = resultArr
				.filter(l => l.sequenceId === lastLetter.sequenceId)
				.map(l => l.letter)
				.join('');
			const matches = getAllMatches(word, sequence);

			// check if any of the matches end at the index of the last letter in word
			const isTrulyLast = matches.some(match => match[1] === word.length);
			if (isTrulyLast) {
				lastLetter.isLast = true;
			} else {
				lastLetter.isLast = false;
			}
		}
	}

	populateResultArr(input);
	const possibleLetters = getPossibleLetters(inputArr, wordSet, resultArr);
	const possibleUniqueLetters = getPossibleUniqueLetters(possibleLetters, wordArr);
	checkFirstLetter(resultArr, word);
	checkLastLetter(resultArr, word);
	getSequences(input, word, resultArr);
	confirmFirstInSequence(resultArr, word);
	confirmLastInSequence(resultArr, word);
	getUsedLetters(possibleUniqueLetters, inputArr);
	checkOrder(resultArr, word);
	return resultArr;
};

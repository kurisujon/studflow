---
source_id: algorithms-sorting-searching-v1
title: Sorting and Searching Algorithms
topic: algorithms
version: 1
---

# Sorting and Searching Algorithms

<!-- anchor: algorithms/intro -->
In computer science, algorithms for sorting and searching are fundamental operations that manipulate data collections. Analyzing their time and space complexity is critical for choosing the right approach for a given dataset and performance constraint.

<!-- anchor: algorithms/binary-search -->
Binary search is a search algorithm that finds the position of a target value within a sorted array. It compares the target value to the middle element of the array. If they are not equal, the half in which the target cannot lie is eliminated and the search continues on the remaining half, again taking the middle element to compare to the target value, and repeating this until the target value is found. The time complexity is O(log n).

<!-- anchor: algorithms/bubble-sort -->
Bubble sort is a simple sorting algorithm that repeatedly steps through the input list element by element, comparing the current element with the one after it, swapping their values if needed. These passes through the list are repeated until no swaps had to be performed during a pass, meaning that the list has become fully sorted. Its worst-case and average-case time complexity is O(n^2), making it highly inefficient on large lists.

<!-- anchor: algorithms/merge-sort -->
Merge sort is an efficient, general-purpose, and comparison-based sorting algorithm. Most implementations produce a stable sort, which means that the order of equal elements is the same in the input and output. Merge sort is a divide-and-conquer algorithm that divides the unsorted list into n sublists, each containing one element, and repeatedly merges sublists to produce new sorted sublists until there is only one sorted list remaining. The worst-case time complexity is O(n log n).

<!-- anchor: algorithms/quick-sort -->
Quicksort is an in-place divide-and-conquer sorting algorithm. It works by selecting a 'pivot' element from the array and partitioning the other elements into two sub-arrays, according to whether they are less than or greater than the pivot. The sub-arrays are then sorted recursively. When implemented well, it can be somewhat faster than merge sort and about two or three times faster than heapsort. Its worst-case time complexity is O(n^2), but its average-case is O(n log n).

// 'use client';

// import { useDispatch, useSelector } from 'react-redux';

// export const useAppDispatch = () => useDispatch();
// export const useAppSelector = useSelector;



//////////////////////////////////


// src/hooks/useAppStore.js
'use client';

import { useDispatch, useSelector } from 'react-redux';
import { store } from '@/src/store';

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
export { store };

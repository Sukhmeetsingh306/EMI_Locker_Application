// 'use client';

// import { Provider } from 'react-redux';
// import { store } from '@/src/store';

// const ReduxProvider = ({ children }) => {
//   return <Provider store={store}>{children}</Provider>;
// };

// export default ReduxProvider;



//////////////////////////////////



// src/providers/ReduxProvider.jsx
'use client';

import { Provider } from 'react-redux';
import { store } from '@/src/store';

const ReduxProvider = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider;

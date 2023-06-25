import { useEffect } from 'react';

import { getConfig } from '../../services/config';

const Config = () => {
  useEffect(() => {
    getConfig();
  }, []);

  return <h1>HOLA</h1>;
};

export default Config;

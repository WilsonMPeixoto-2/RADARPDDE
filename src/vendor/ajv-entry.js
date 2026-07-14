import Ajv from 'ajv';

if (typeof window !== 'undefined') {
    window.RadarAjv = Ajv;
}

export { Ajv };

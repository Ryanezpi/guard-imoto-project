import axios from 'axios';
import { API_BASE } from '../constants/config';

export const api = axios.create({ baseURL: API_BASE });

import { AxiosResponse} from 'axios';



export interface CommonResponse extends AxiosResponse {
  data: string;
}
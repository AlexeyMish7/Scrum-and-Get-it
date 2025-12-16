import http from 'k6/http';
import { check, sleep } from 'k6';

// export let options = {
//   vus: 10,
//   duration: '30s',
// };
export let options = {
  stages: [
    { duration: '0.5s', target: 10 },
    { duration: '0.5s', target: 25 },
    { duration: '0.5s', target: 50 },
    { duration: '0.5s', target: 75 },
    { duration: '0.5s', target: 100 },
    { duration: '0.5s', target: 0 },
  ],
};

export default function () {
  const res = http.get('https://scrum-and-get-it-fjyi.vercel.app');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
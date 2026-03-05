import Reactotron from 'reactotron-react-native';

const reactotron = Reactotron
  .configure({
    name: 'Breja.me',
  })
  .useReactNative()
  .connect();

export default reactotron;

import Reactotron from "reactotron-react-native";

if (__DEV__) {
  Reactotron.configure({ name: "Breja.me" }).useReactNative().connect();
}

export default Reactotron;

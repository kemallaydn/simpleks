import axios from "axios";
import { useState } from "react";
import { Alert, Button, SafeAreaView, Text, TextInput, View } from "react-native";
import { LogBox } from "react-native";
LogBox.ignoreLogs([
  "possible unhandled promise rejection",
]);
function App() {
  const [list, setList] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [zindeks, setZindeks] = useState('');
  const [sonuc, setSonuc] = useState();
  const [optimizationRequest, setOptimizationRequest] = useState({
    coefficients: [],
    constraints: [],
    relationships: [],
    limits: [],
  });
  const addToDo = () => {
    if (inputValue.trim() !== '') {
      setList([...list, inputValue]);
      setInputValue('');
    }
  };
  const parseCoefficients = () => {
    const coefficients = parseCoefficientString(zindeks).map(parseFloat);
    setOptimizationRequest((prevState) => ({
      ...prevState,
      coefficients,
    }));
  };
  const parseCoefficientString = (zindeks) => {
    const cleanedString = zindeks.replace(/\s/g, '');
    const terms = cleanedString.toLowerCase().match(/(\d*x\d+)/g);
    if (!terms) {
      Alert.alert('Katsayıları içeren giriş boş veya geçersiz.');
      return [];
    }
    const coefficients = terms.map((term) => {
      const match = term.match(/(\d*)x(\d*)/);
      return match ? (match[1] ? parseInt(match[1]) : 1) : 0;
    });
    return coefficients;
  };
  const parseAndAddConstraint = () => {
    const parsedConstraint = parseConstraint(inputValue);
    let a: string;
    if (parsedConstraint.relationship.includes("<=")) {
      a = parsedConstraint.relationship.replace("<=", "GEQ")
    } else if (parsedConstraint.relationship.includes(">=")) {
      a = parsedConstraint.relationship.replace(">=", "GEQ")
    } else if (parsedConstraint.relationship.includes(">")) {
      a = parsedConstraint.relationship.replace(">", "GEQ")
    } else if (parsedConstraint.relationship.includes("<")) {
      a = parsedConstraint.relationship.replace("<", "GEQ")
    } else if (parsedConstraint.relationship.includes("==")) {
      a = parsedConstraint.relationship.replace("==", "EQ")
    }

    setOptimizationRequest((prevState) => ({
      ...prevState,
      constraints: [...prevState.constraints, parsedConstraint.coefficients.map(parseFloat)],
      relationships: [...prevState.relationships, a],
      limits: [...prevState.limits, parsedConstraint.limit],
    }));
    setInputValue('');
  };
  const send = async () => {
    const response = await axios.post("http://localhost:8080/optimize", optimizationRequest).catch((err) => { Alert.alert("Girilen format uygun değil") });
   if(response){
    setSonuc(response.data)
   }
  }
  const parseConstraint = (inputConstraint) => {
    const parts = inputValue.toLowerCase().match(/([^<>=]+)\s*([<>]=?)\s*(\d+)/);

    if (!parts || parts.length !== 4) {
      Alert.alert('Uygunsuz format:', inputValue);
      return {
        coefficients: [],
        relationship: '',
        limit: 0,
      };
    }
    if (inputValue.trim() !== '') {
      setList([...list, inputValue]);
      setInputValue('');
    }
    const variables = parts[1].split(/\s*\+\s*/);

    const coefficients = variables.map((variable) => {
      const match = variable.match(/(\d*)\s*(x\d*)/);
      return match ? (match[1] ? parseInt(match[1]) : 1) : 0;
    });

    const relationship = parts[2];
    const limit = parseFloat(parts[3]);

    return {
      coefficients,
      relationship,
      limit,
    };
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#4D4D4D" }}>
      <View style={{ alignItems: 'center', padding: 10 }}>
        <Text style={{ fontSize: 30, color: "white" }}>Simpleks</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: "5%" }}>
        <View>
          <Text style={{ fontSize: 15, color: "white", paddingVertical: '5%' }}> Z Maks Giriniz</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 }}>
            <TextInput value={zindeks} onChangeText={(text) => {
              setZindeks(text)
            }} placeholder="6x1 + 8x2" placeholderTextColor={"#7E8087"} style={{ flex: 1, marginLeft: '1%', color: "white", paddingHorizontal: '0%', paddingVertical: 5 }} />
            <Button title="Ekle" color={"white"} onPress={parseCoefficients} />
          </View>
        </View>
        <View>
          <Text style={{ fontSize: 15, color: "white", paddingVertical: '5%' }}>Kısıtlamaları Giriniz</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 }}>
            <TextInput value={inputValue} onChangeText={(text) => setInputValue(text)} placeholder="5x1 + 10x2 <= 110" placeholderTextColor={"#7E8087"} style={{ flex: 1, marginLeft: '1%', color: "white", paddingHorizontal: '0%', paddingVertical: 5 }} />
            <Button title="Ekle" color={"white"} onPress={() => {

              parseAndAddConstraint()
            }} />
          </View>
        </View>
        <View style={{flexDirection:"row"}}>
          <View style={{flex:3.2}}>
            <Text style={{ fontSize: 15, color: "white", paddingVertical: '5%' }}>Model</Text>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ color: "white" }}>Z Mask : </Text>
              <Text style={{ color: "white" }}>{zindeks}</Text>
            </View>
            <View style={{ marginTop: '3%' }}>
              <Text style={{ color: "white" }} >Kısıtlar : </Text>
              {list.map((item, index) => (
                <Text style={{ color: "white" }} key={index}>{item}</Text>
              ))}
            </View>
            {sonuc &&

              <View style={{ marginTop: '3%' }}>
                <Text style={{ color: "white" }} >Sonuç : </Text>
                <Text style={{ color: "white" }} >Z  :  {sonuc.value}</Text>
                <Text style={{ color: "white" }} >X1 : {sonuc.key[0]}</Text>
                <Text style={{ color: "white" }} >x2 : {sonuc.key[1]}</Text>

              </View>
            }
          </View>
          <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
            <Button title="Temizle" color={"white"} onPress={() =>{
              setOptimizationRequest({
                coefficients: [],
                constraints: [],
                relationships: [],
                limits: [],
              })
              setList([])
              setZindeks('')
              setSonuc(null)
              setInputValue("")
            }} />
          </View>
        </View>
      </View>
      <View style={{ marginBottom: '10%' }}>
        <Button title="Hesapla" color={"white"} onPress={() => send()} />

      </View>


    </SafeAreaView>
  )
}
export default App;
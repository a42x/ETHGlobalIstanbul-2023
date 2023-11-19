/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import {ethers} from 'ethers';

const CryptoJS = require('rn-crypto-js') as any;
const halo = require('@arx-research/libhalo/api/react-native.js') as any;
const execHaloCmdRN = halo.execHaloCmdRN;

// import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  // useColorScheme,
  View,
  TouchableOpacity,
  TextInput,
  Linking,
  Image,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

const baseUrl = 'https://api-istanbul-ocofkdohwq-an.a.run.app';

NfcManager.start();
const indices: number[] = [1]; //countryCode
const countryIndex = 1;

function App(): JSX.Element {
  // const [output, setOutput] = useState('');
  const [userSecret, setUserSecret] = useState('secret');
  const [countryCode, setCountryCode] = useState('');
  const signInfoDefault: {userOperation: null | object; visible: boolean} = {
    userOperation: null,
    visible: false,
  };
  const [signInfo, setSignInfo] = useState(signInfoDefault);
  const [link, setLink] = useState({url: '', visible: false});

  const readNdef = async () => {
    try {
      setSignInfo(signInfoDefault);
      await NfcManager.requestTechnology(NfcTech.IsoDep);
      // const tag = await NfcManager.getTag();

      const ndef = await execHaloCmdRN(NfcManager, {
        name: 'read_ndef',
      });
      console.log(ndef);
      // let newOutput = output + JSON.stringify(ndef);
      // setOutput(newOutput);
      const {pk1, latch2} = ndef.qs as {pk1: string; latch2: string};
      const uid = `0x${latch2.toLowerCase()}`;
      console.log(`uid: ${uid}`);

      //download encripted hash
      const targetUrl = `${baseUrl}/proofs?${new URLSearchParams({
        chainId: '11155111',
        uid,
        indices: `${indices.join(',')}`,
      })}`;
      console.log(`targetUrl: ${targetUrl}`);
      const response = await fetch(targetUrl);
      // console.log(await response.text());
      const proofRes = (await response.json()) as {
        proofs: string[];
        leaves: string[];
      };
      console.log(`ciphertext: ${JSON.stringify(proofRes)}`);
      const [proofBytes, leafBytes] = [proofRes.proofs, proofRes.leaves].map(
        a => a.map(s => CryptoJS.AES.decrypt(s, userSecret)),
      );
      let [proofs, leaves]: string[][] = [[], []];
      try {
        const [proofStrings, leafStrings] = [proofBytes, leafBytes].map(a =>
          a.map(b => b.toString(CryptoJS.enc.Utf8) as string),
        );
        console.log(proofStrings);
        console.log(leafStrings);
        proofs = proofStrings.map(s => JSON.parse(s));
        leaves = leafStrings;
      } catch (ex) {
        console.warn('decrypt error!!');
        throw ex;
      }
      console.log(`proof: ${JSON.stringify(proofs)}`);
      console.log(`leaf: ${JSON.stringify(leaves)}`);

      if (indices.includes(countryIndex)) {
        indices.forEach((value, i) => {
          if (value === countryIndex) {
            setCountryCode(leaves[i]);
          }
        });
      }
      //build userOperation
      const buildUrl = `${baseUrl}/build`;
      const body = {
        owner: ethers.computeAddress('0x' + pk1.toLowerCase()),
        chainId: 11155111,
        fundId: 0,
        uid,
        dataIndices: indices,
        leaves,
        proofs,
      };
      console.log(`body: ${JSON.stringify(body)}`);
      const response2 = await fetch(buildUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      // console.log(await response2.text());
      const userOperation = (await response2.json()) as object;
      console.log(`userOpration: ${JSON.stringify(userOperation)}`);
      // setOutput(JSON.stringify(userOperation));
      setSignInfo({userOperation: userOperation, visible: true});
    } catch (ex) {
      console.warn('Oops!', ex);
      // setOutput('Ooops!');
    } finally {
      // stop the nfc scanning
      await NfcManager.cancelTechnologyRequest();
    }
  };

  const sign = async () => {
    const userOperataion = signInfo.userOperation as any;
    if (userOperataion != null) {
      try {
        await NfcManager.requestTechnology(NfcTech.IsoDep);

        const signed = (await execHaloCmdRN(NfcManager, {
          name: 'sign',
          message: userOperataion.userOpHash?.substring(2),
          keyNo: 1,
        })) as {signature: {ether: string}};
        console.log(`sign: ${JSON.stringify(signed)}`);
        const userOperataionWithSignature = {
          ...userOperataion.userOperation,
          signature: signed.signature.ether,
        };
        console.log(
          `userOperataionWithSignature: ${JSON.stringify(
            userOperataionWithSignature,
          )}`,
        );
        // send UserOperation
        const sendUrl = `${baseUrl}/send`;
        const response = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userOperataionWithSignature),
        });
        const responseJson = (await response.json()) as any;
        console.log(`response: ${JSON.stringify(responseJson)}`);
        const {userOpHash} = responseJson;
        if (userOpHash != null) {
          setLink({
            url: `https://jiffyscan.xyz/userOpHash/${userOpHash}?network=sepolia`,
            visible: true,
          });
          // setOutput('FINISH!! OKey!!!');
          console.log('FINISH!!');
        }
      } finally {
        await NfcManager.cancelTechnologyRequest();
      }
    } else {
      setSignInfo(signInfoDefault);
    }
  };
  const reset = async () => {
    setSignInfo(signInfoDefault);
    setLink({url: '', visible: false});
    setCountryCode('');
    // setOutput('');
  };
  const openLink = async () => {
    await Linking.openURL(link.url);
  };

  return (
    <SafeAreaView style={{backgroundColor: Colors.white, height: 1200}}>
      <StatusBar />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={{alignItems: 'center', margin: 25}}>
          <Image
            source={{
              uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Logo_of_UNICEF.svg/1024px-Logo_of_UNICEF.svg.png',
            }}
            width={328}
            height={80}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            margin: 10,
            alignSelf: 'center',
            height: 40,
          }}>
          <Text
            style={{
              color: Colors.black,
              height: 25,
              fontSize: 18,
              verticalAlign: 'bottom',
              marginRight: 5,
            }}>
            input password:
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              width: 150,
              height: 25,
              fontSize: 18,
              verticalAlign: 'bottom',
              padding: 4,
            }}
            defaultValue={userSecret}
            secureTextEntry={true}
            onChangeText={t => setUserSecret(t)}
          />
        </View>
        {countryCode !== '' ? (
          <View style={{alignSelf: 'center'}}>
            {countryCode === '90' ? (
              <View>
                <Text
                  style={{
                    fontWeight: 'bold',
                    alignSelf: 'center',
                    verticalAlign: 'bottom',
                  }}>
                  Your are Turkish Resident!({countryCode})
                </Text>
                <Text style={{fontSize: 80, alignSelf: 'center'}}>🇹🇷</Text>
              </View>
            ) : (
              <Text>....</Text>
            )}
          </View>
        ) : (
          <Text>....</Text>
        )}
        {signInfo.visible ? (
          <View style={{...styles.sampleView, padding: 10}}>
            <TouchableOpacity
              style={{
                ...styles.touchableOpacity,
                backgroundColor: '#ffa500',
              }}
              onPress={sign}>
              <Text style={{fontWeight: 'bold'}}>STEP2. Sign and Send</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sampleView}>
            <TouchableOpacity
              style={styles.touchableOpacity}
              onPress={readNdef}>
              <Text style={{fontWeight: 'bold'}}>
                STEP1. Read ID and Download Cert
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {link.visible ? (
          <TouchableOpacity onPress={openLink}>
            <Text style={{textDecorationLine: 'underline', color: Colors.blue}}>
              {link.url}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text> </Text>
        )}
        <View style={styles.sampleView}>
          <TouchableOpacity
            style={{...styles.touchableOpacity, backgroundColor: '#ff5555'}}
            onPress={reset}>
            <Text style={{fontWeight: 'bold'}}>Reset</Text>
          </TouchableOpacity>
        </View>
        {/* <View style={{backgroundColor: Colors.white}}>
          <Text style={{color: Colors.black}}>{output}</Text>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  sampleView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  touchableOpacity: {
    padding: 20,
    backgroundColor: '#199dc4',
  },
});

export default App;

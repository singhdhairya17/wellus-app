import { View, Text, Image, Pressable, Alert } from 'react-native'
import React, { useContext, useState } from 'react'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'
import { Link, useRouter } from 'expo-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../services/FirebaseConfig'
import { useConvex } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserContext } from '../../context/UserContext'
export default function SignIn() {

    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const convex = useConvex();
    const { user, setUser } = useContext(UserContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const onSignIn = () => {
        if (!email || !password) {
            Alert.alert('Missing Fields!', 'Enter All field Value')
            return;
        }

        setLoading(true);
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                // Signed in 
                const user = userCredential.user;
                const userData = await convex.query(api.Users.GetUser, {
                    email: (email).toLowerCase()
                })

                console.log(userData);
                setUser(userData);
                router.push('/(tabs)/Home')
                setLoading(false);
                // ...
            })
            .catch((error) => {
                setLoading(false);
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorMessage)
                Alert.alert("Incorrect Email & Password", "Please enter valid email and password")
            });

    }

    return (
        <View style={{
            display: 'flex',
            alignItems: 'center',
            padding: 20
        }}>
            <Image source={require('./../../assets/images/logo.png')}
                style={{
                    width: 150,
                    height: 150,
                    marginTop: 60
                }}
            />

            <Text style={{
                fontSize: 35,
                fontWeight: 'bold',
            }}>Welcome Back</Text>

            <View style={{
                marginTop: 20,
                width: '100%'
            }}>
                <Input placeholder={'Email'} onChangeText={setEmail} />
                <Input placeholder={'Password'} password={true} onChangeText={setPassword} />

            </View>
            <View style={{
                marginTop: 15,
                width: '100%'
            }}>
                <Button title={'Sign In'}
                    onPress={() => onSignIn()}
                    loading={loading}
                />

                <Text style={{
                    textAlign: 'center',
                    fontSize: 16,
                    marginTop: 15
                }}>Don't have an account? </Text>
                <Link href={'/auth/SignUp'} ><Text
                    style={{
                        textAlign: 'center',
                        fontSize: 16,
                        marginTop: 5,
                        fontWeight: 'bold'
                    }}>Create New Account</Text></Link>
            </View>
        </View>
    )
}
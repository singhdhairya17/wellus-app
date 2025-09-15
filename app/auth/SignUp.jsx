import { View, Text, Image, Pressable, Alert } from 'react-native'
import React, { useContext, useState } from 'react'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'
import { Link, useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../services/FirebaseConfig'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserContext } from '../../context/UserContext'


export default function SignUp() {

    const [name, setName] = useState();
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const createNewUser = useMutation(api.Users.CreateNewUser)
    const { user, setUser } = useContext(UserContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const onSignUp = () => {
        if (!name || !email || !password) {
            Alert.alert('Missing Fields!', 'Enter All field Value')
            return;
        }

        setLoading(true);
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                // Signed up 
                const user = userCredential.user;
                console.log(user)
                if (user) {
                    const result = await createNewUser({
                        name: name,
                        email: (email).toLowerCase()
                    });

                    console.log(result);
                    setUser(result);
                    // Navigate to Home Screen
                    router.push('/auth/SignIn')
                    setLoading(false);
                }
                // ...
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorMessage)
                setLoading(false)
                // ..
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
            }}>Create New Account</Text>

            <View style={{
                marginTop: 20,
                width: '100%'
            }}>
                <Input placeholder={'Full Name'} onChangeText={setName} />
                <Input placeholder={'Email'} onChangeText={setEmail} />
                <Input placeholder={'Password'} password={true} onChangeText={setPassword} />

            </View>
            <View style={{
                marginTop: 15,
                width: '100%'
            }}>
                <Button title={'Create Account'}
                    onPress={() => onSignUp()}
                    loading={loading}
                />

                <Text style={{
                    textAlign: 'center',
                    fontSize: 16,
                    marginTop: 15
                }}>Already have an account? </Text>
                <Link href={'/auth/SignIn'} ><Text
                    style={{
                        textAlign: 'center',
                        fontSize: 16,
                        marginTop: 5,
                        fontWeight: 'bold'
                    }}>Sign In Here</Text></Link>
            </View>
        </View>
    )
}
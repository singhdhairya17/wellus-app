import { View, Text, Modal, ActivityIndicator } from 'react-native'
import React from 'react'
import Colors from '../../constants/colors'

export default function LoadingDialog({ loading = false, message = 'Loading...' }) {
    return (
        <Modal transparent visible={loading}>
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#00000070'
            }}>
                <View style={{
                    padding: 20,
                    borderRadius: 15,
                    backgroundColor: Colors.PRIMARY,
                    alignItems: 'center',
                    minWidth: 200
                }}>
                    <ActivityIndicator size={'large'}
                        color={Colors.WHITE}
                    />
                    <Text style={{
                        color: Colors.WHITE,
                        fontSize: 16,
                        marginTop: 12,
                        textAlign: 'center'
                    }}>{message}</Text>

                </View>
            </View>
        </Modal>
    )
}
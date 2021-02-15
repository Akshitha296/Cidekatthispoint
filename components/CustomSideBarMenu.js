import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Alert, Image, Modal, ScrollView } from 'react-native';
import db from '../config'
import { Avatar } from 'react-native-elements'
import * as ImagePicker from 'expo-image-picker'
import firebase from 'firebase'
import { DrawerItems } from 'react-navigation-drawer'

export default class CustomSideBarMenu extends React.Component{
    state = {
        userId: firebase.auth().currentUser.email,
        image: '#',
        name: '',
        docId: '',
    }

    selectPicture = async() => {
        const {cancelled, uri} = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowEditing: true,
            aspect: [4, 3],
            quality: 1,
        }) 
        if(!cancelled){
            this.uploadImage(uri, this.state.userId)
        }
    }

    uploadImage = async(uri, imageName) => {
        var response = await fetch(uri)
        var blob = await response.blob()
        var ref = firebase.storage().ref().child("user_profiles" + imageName)
        return ref.put(blob).then((response) => {
            this.fetchImage(imageName)
        })
    }

    fetchImage = async(imageName) => {
        var storageRef = await firebase.storage().ref().child("user_profiles" + imageName)
        await storageRef.getDownloadURL().then((url)=> {
            this.setState({
                image: url,
            })
        }).catch((error) => {
            this.setState({
                image: '#',
            })
        })
    }

    getUserProfile(){
        db.collection('users').where('emailId', '==', this.state.userId).onSnapshot((snapshot) => {
            snapshot.forEach((doc) => {
                this.setState({
                    name: doc.data().first_name + " " + doc.data().last_name,
                    docId: doc.id,
                    image: doc.data.image
                })
            })
        })
    }

    componentDidMount(){
        this.fetchImage(this.state.userId)
        this.getUserProfile()
    }

    render(){
        return(
            <View style = {styles.container}>
                <View style = {{flex: 0.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'green'}}>
                    <Avatar
                        rounded
                        source = {{uri: this.state.image}}
                        size = "medium"
                        onPress = {() => {
                            this.selectPicture()
                        }}
                        containerStyle = {styles.importContainer}
                        showEditButton
                    />
                </View>
                <View style = {styles.drawerItemsContainer}>
                    <DrawerItems
                        {...this.props}
                    />

                </View>
                <View style = {styles.logoutContainer}>
                    <TouchableOpacity onPress = {() => {
                        this.props.navigation.navigate('WelcomeScreen')
                        firebase.auth().signOut()
                    }}
                    style = {styles.logoutButton}
                    >
                        <Text style = {styles.logoutText}>
                            Logout
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }, 
    drawerItemsContainer: {
        flex: 0.8,
    },
    logoutButton: {
        height: 30,
        width: '100%',
        justifyContent: 'center',
        padding: 10,
    },
    logoutContainer: {
        flex: 0.2,
        justifyContent: 'flex-end',
        paddingBottom: 30,
    },
    logoutText: {
        fontSize: 30,
        fontWeight: 'bold',
    },
    importContainer: {
        flex: 0.75,
        width: '40%',
        height: '80%',
        marginLeft: 20,
        marginTop: 30,
        borderRadius: 40,
    }
})
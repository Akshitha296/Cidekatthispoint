import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Alert, Image, Modal, ScrollView, TouchableHighlight } from 'react-native';
import MyHeader from '../components/myHeader'
import db from '../config'
import firebase from 'firebase'
import { BookSearch } from 'react-native-google-books'

export default class RequestScreen extends React.Component{
    constructor(){
        super();
        this.state = {
            bookName: '',
            reason: '',
            userId: firebase.auth().currentUser.email,
            request_id: '',
            isBookRequestActive: '',
            userDocId: '',
            requestedBookName: '',
            bookStatus: '',
            docId: '',
            Imagelink: '',
            dataSource: '',
            showFlatlist: false,
        }
    }

    createUniqueId(){
        return(Math.random().toString(36).substring(7))
    }

    async getBooksFromApi(bookName){
        this.setState({
            bookName: bookName,
        })
        if(bookName.length > 2){
            var books = await BookSearch.searchBook(bookName, 'AIzaSyBGKKWXxG8Neuya79v8yiKlHpvmQNwehSM')
            this.setState({
                dataSource: books.data, 
                showFlatlist: true,
            })
        }
    } 

    renderItem = ({item, i}) => {
        let obj = {
            title: item.volumeInfo.title,
            selfLink: item.selfLink,
            buyLink: item.saleInfo,
            imageLink: item.volumeInfo.imageLink,
        }
        return(
            <TouchableHighlight style = {{alignItems: 'center', backgroundColor: '696969', padding: 10, width: '90%'}}
                                activeOpacity = {0.6}
                                underlayColor = '#696969'
                                    onPress = {() => {
                                        this.setState({
                                            showFlatlist: false,
                                            bookName: item.volumeInfo.title,
                                        })
                                    }}
                                bottomDivider
            >

                <Text>
                    {item.volumeInfo.title}
                </Text>

            </TouchableHighlight>
        )
    }

    addRequest = async(bookname, reasonforrequest) =>{
        var userId = this.state.userId
        var randomRequestId = this.createUniqueId()
        db.collection('requested_books').add({
            user_id: userId,
            book_name: bookname,
            reason_to_request: reasonforrequest,
            request_id: randomRequestId,
            book_status: 'requested',
            date: firebase.firestore.FieldValue.serverTimestamp()
        })
        await this.getBookRequest()
        db.collection('users').where('emailId', '==', this.state.userId).get().then((snapshot) => {
            snapshot.forEach((doc) => {
                db.collection('users').doc(doc.id).update({
                   isBookRequestActive: true 
                })
            })
        })
        this.setState({
            bookName: '',
            reason: '',
        })
    }

    getIsBookRequestActive = () => {
        db.collection('users').where('emailId', '==', this.state.userId).onSnapshot(snapshot => {
            snapshot.forEach(doc => {
                this.setState({
                    isBookRequestActive: doc.data().isBookRequestActive,
                    userDocId: doc.id
                })
            })
        })
    }

    getBookRequest = () => {
        db.collection('requested_books').where('user_id', '==', this.state.userId).get().then((snapshot) => {
            snapshot.forEach((doc) => {
                if(doc.data().book_status !== 'received'){
                    this.setState({
                        request_id: doc.data().request_id,
                        requestedBookName: doc.data().book_name,
                        bookStatus: doc.data().book_status,
                        docId: doc.id,
                    })
                }
            })
        })
    }

    sendNotification = () => {
        db.collection('users').where('emailId', '==', this.state.userId).get().then((snapshot) => {
            snapshot.forEach((doc) => {
                var name = doc.data().first_name
                var lastName = doc.data.last_name
                db.collection('all_notifications').where('request_id', '==', this.state.request_id).get().then((snapshot) => {
                    snapshot.forEach((doc) => {
                        var donorId = doc.data().donor_id
                        var bookName = doc.data().book_name
                        db.collection('all_notifications').add({
                            targeted_user_id: donorId,
                            message: name + " " + lastName + " received the book: "  + bookName,
                            notification_status: 'unread',
                            book_name: bookName,
                        })
                    })
                })
            })
        })
    }

    updateBookRequestStatus = () => {
        db.collection('requested_books').doc(this.state.docId).update({
            book_status: "received"
        })
        db.collection('users').where('emailId', '==', this.state.userId).get().then((snapshot) => {
            snapshot.forEach((doc) => {
                db.collection('users').doc(doc.id).update({
                    isBookRequestActive: false
                })
            })
        })
    }

    receivedBooks = (bookName) => {
        var userId = this.state.userId
        var requestId = this.state.request_id
        db.collection('received_books').add({
            user_id: userId,
            request_id: requestId,
            book_name: bookName,
            book_status: 'received'
        })
    }

    componentDidMount(){
        this.getBookRequest()
        this.getIsBookRequestActive()
    }

    render(){
        if(this.state.isBookRequestActive === true){
            return(
                <View style = {{flex: 1, justifyContent: 'center'}}>
                    <View style = {{borderColor: 'orange', borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 10, margin: 10,}}>
                        <Text>
                            Book Name: 
                        </Text>

                        <Text>
                            {this.state.requestedBookName}
                        </Text>
                    </View>

                    <View style = {{borderColor: 'orange', borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 10, margin: 10,}}>
                        <Text>
                            Book Status: 
                        </Text>

                        <Text>
                            {this.state.bookStatus}
                        </Text>
                    </View>

                    <TouchableOpacity style = {{borderWidth: 1, borderColor: 'orange', backgroundColor: 'orange', width: 300, alignSelf: 'center', alignItems: 'center', height: 30,}}
                                      onPress = {() => {
                                          this.sendNotification()
                                          this.updateBookRequestStatus()
                                          this.receivedBooks(this.state.requestedBookName)
                                      }}
                    >
                        <Text>
                            I received this book.
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        } else {
            return(
                <View style = {{flex: 1}}>
                    <MyHeader
                        title = "Request Book"
                        navigation = {this.props.navigation}
                    />
                    <View>
                        <TextInput
                            style = {styles.formTextInput}
                            placeholder = "Book Name Here"
                            onChangeText = {text => {
                                this.getBooksFromApi()
                            }}
                            onClear = {text => {
                                this.getBooksFromApi()
                            }}
                            value = {this.state.bookName}
                        /> 

                        {this.state.showFlatlist ?
                        (
                            <FlatList
                                data = {this.state.dataSource}
                                renderItem = {this.renderItem()}
                                enableEmptySections = {true}
                                style = {{marginTop: 10}}
                                keyExtractor = {(item, index) => index.toString()}
                            />
                        ) : (
                            <View>
                        <TextInput
                            style = {[styles.formTextInput, {height: 300}]}
                            placeholder = "Reason for request"
                            onChangeText = {(text) => {
                                this.setState({
                                    reason: text
                                })
                            }}
                            value = {this.state.reason}
                            multiline
                            numberOfLines = {8}
                        />

                        <TouchableOpacity style = {styles.requestButton} 
                                        onPress = {() =>{
                                            this.addRequest(this.state.bookName, this.state.reason)
                                        }}
                        >
                            <Text>
                                Request
                            </Text>
                        </TouchableOpacity>
                        </View>
                        )}
                    </View>
                </View>
            )
        }
    }
}

const styles = StyleSheet.create({
    keyboardStyle: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formTextInput: {
        width: '75%',
        height: 40,
        borderRadius: 3,
        borderColor: 'brown',
        alignSelf: 'center',
        marginTop: 20,
    }, 
    requestButton: {
        width: '75%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        borderRadius: 10,
        backgroundColor: 'green'
    }
})
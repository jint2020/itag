import React from 'react';
import './App.css';
import Amplify, { API, Storage } from 'aws-amplify';
import { AmplifyAuthenticator, AmplifySignUp, AmplifySignOut } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
//import awsconfig from './aws-exports';
import awsconfig from "./aws-exports";
import Alert from '@material-ui/lab/Alert';


Amplify.configure(awsconfig);

const AuthStateApp = () => {

    const [authState, setAuthState] = React.useState();
    const [user, setUser] = React.useState();


    React.useEffect(() => {
      return onAuthUIStateChange((nextAuthState, authData) => {
        setAuthState(nextAuthState);
        setUser(authData);
      });
    }, []);

    React.useEffect(() => {
      if(authState == AuthState.SignedIn){
        loadImageETag()
      }
    },[authState])

    const [albumProgress, setAlbumProgress] = React.useState('loading');

    const [tagStr, setTagStr] = React.useState('');

    const [eTags, setETags] = React.useState([]);

    const [images, setImages] = React.useState([]);

    const loadImageETag = async () => {
      setAlbumProgress('loading')
      const tags = tagStr.split(',')
      var params = {}
      tags.forEach(function (value, index) {
        params['tag' + index] = value
      });

      API.get('fit5225assignment2jt', '/images', {queryStringParameters: params})
        .then(response => {
          setETags(response);
        })
        .catch(error => {
          console.log(error);
        })
    }

    React.useEffect(() => {
      if (authState === AuthState.SignedIn && user){
        loadImage()
      }
    },[eTags])

    const loadImage = () => {
      Storage.list('',{level:'public'})
      .then( async (result) => {
        var displayImages = []
        for (const [index, image] of result.entries()){
          if(eTags.length>0 && !eTags.includes(image['eTag'])){
            continue
          }
          const singedURL = await Storage.get(image['key'],{level:'public'});
          const tmpImage = image
          tmpImage['url'] = singedURL
          displayImages.push(tmpImage)
        }
        setImages(displayImages)
        setAlbumProgress('loaded')
      })
    }


    //image display
    const ImageComponent = props => {
      const image = props.image
      const imageStyle = {
        width: "128px",
        height: "128px"
      }

      const [tag, setTag] = React.useState('');
      const [showAlert, setShowAlert] = React.useState('');

      const handleTagChange = (event) => {
        setTag(event.target.value)
      }

      const addTag = () => {
        var params = {'etag':image['eTag'], 'tag':tag}
        API.put('fit5225assignment2jt', '/images', {queryStringParameters: params})
        .then(response => {
          setShowAlert("Manual addition of a new tag: "+ tag);
        })
        .catch(error => {
          console.log(error)
        })
      }

      const deleteImageFromDB = () => {
        var params = { etag: image['eTag']}
        API.del('fit5225assignment2jt', '/images', {queryStringParameters: params})
        .then(response => {
          deleteImageFroms3();
        })
        .catch(error => {
          console.log(error);
        })
      }

      const deleteImageFroms3 = () => {
        const key = image['key']
        Storage.remove(key, {level: 'public'})
        .then(() => {
          props.onDeleteImage();
        })
        .catch(error => {
          console.log(error);
        })
      }

      return (
        <>
        <span>
          <div>
            <img style={imageStyle} src={image['url']} />
            <div>
            <label>
              <input type="text" name="tag" value={tag} onChange={handleTagChange} />
              <button onClick={() => addTag()}>Add</button>
            </label>
            <button onClick={() => deleteImageFromDB()}>Remove img</button>
            </div>
          </div>
        </span>
        </>
      )
    }

    const albumContent = () => {
      switch (albumProgress) {
        case 'loading':
          return (
            <>
            <p>Loading image library.</p>
            <p>Please wait.</p>
            </>
          )
        case 'loaded':
          return images.map( (each) => {
            return (
              <ImageComponent key={each['url']} image={each} onDeleteImage={loadImageETag} />
            )
          })

        default:
          break;
      }
    }

    const searTag = () => {
      return (
        <>
        <div>
        Searching for: {tagStr} <input type="text" value={tagStr} onChange={e => setTagStr(e.target.value)} /> <button onClick={loadImageETag}> Search </button>
        </div>
        </>
      )
    }

    // upload image

    const [uploadProgress, setUploadProgress] = React.useState('getUpload');
    const [uploadIamge, setUploadImage] = React.useState();
    const [errorMessage, setErrorMessage] = React.useState();

    const upload = async () => {
      try {
        setUploadProgress('uploading')
        await Storage.put(`${user.username + Date.now()}.jpg`, uploadIamge, { level: 'public', contentType: 'image/jpg' });
        setUploadProgress('uploaded')
      } catch (error) {
        console.log('error upload', error)
        setErrorMessage(error.message)
        setUploadProgress('uploadError')
      }
    }

    const uploadContent = () => {
      switch (uploadProgress) {
        case 'getUpload':
          return (
            <>
              <input type="file" accept="image/*" onChange={e => setUploadImage(e.target.files[0])} />
              <button onClick={upload}> Upload image</button>
            </>
          )
        case 'uploading':
          return (
            <p>Uploading image, please wait.</p>
          )
        case 'uploaded':
          return (
            <>
              <div>Uploaded successfully!</div>
              <input type="file" accept="image/*" onChange={e => setUploadImage(e.target.files[0])} />
              <button onClick={upload}> Upload image</button>

            </>
          )
        case 'uploadError':
          return (
            <>
              <div>Error: fail to upload, try again later!</div>
              <input type="file" accept="image/*" onChange={e => setUploadImage(e.target.files[0])} />
              <button onClick={upload}> Upload image</button>

            </>
          )
        default:
          break;
      }
    }

    React.useEffect(() => {
      if (uploadProgress == 'uploaded') {
        loadImageETag()
      }
    }, [uploadProgress])


    return authState === AuthState.SignedIn && user ? (

      <div className="App">
        <header className="App-header">
        <div>
          <h1 className="sha-title" >Welcome to iTag<br/>Assignment-2 </h1></div>
          <div>
            <h2>Upload Image</h2>
            {uploadContent()}
          </div>
          <div>
          <h2>Search by Tag</h2>
          {searTag()}
          </div>

          <h2>Images Library</h2>
          <p className="sha-word" >enter a tag in the box, and click "Add" button to submit</p>
          <div className='newspaper'>
            {albumContent()}
          </div>
          <AmplifySignOut />
        </header>
      </div>
    ) : (
      <AmplifyAuthenticator>
        <AmplifySignUp
          slot="sign-up"
          formFields={[
            { type: 'username' },
            { type: 'password' },
            {
              type: 'given_name',
              label: "Given Name * ",
              placeholder: "Enter your given name",
              required: true,
            },
            {
              type: "family_name",
              label: "Family Name *",
              placeholder: "Enter your family name",
              required: true,
            }
          ]}
        />
      </AmplifyAuthenticator>
    );
};


export default AuthStateApp;
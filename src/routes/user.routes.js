import {Router} from 'express'
import {upload} from '../middlewares/multer.middleware.js'
import {  registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    getAllUsers,
    updateAccountDetails,
    updateUserProfilePic,
    forgetPassword,
    resetPassword,
    deleteProfile,} from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { verifyAdmin } from '../middlewares/admin.middleware.js';

const router=Router();

router.route('/register').post(upload.single("profilePic"),registerUser)
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT,logoutUser)
router.route('/refreshToken').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT,changeUserPassword)
router.route('/current-user').get(verifyJWT,getCurrentUser)
router.route('/all').get(verifyJWT,verifyAdmin,getAllUsers)
router.route('/update-details').patch(verifyJWT,updateAccountDetails)
router.route('/update/profile').patch(verifyJWT, upload.single("profilePic"),updateUserProfilePic)
router.route('/forget').post(forgetPassword);
router.route('/reset/:token').post(resetPassword)
router.route('./delete:/user').delete(verifyJWT,verifyAdmin,deleteProfile);

export default router;
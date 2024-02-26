/**@format */

/**
 * Tianyu Server-base error code
 */
export const ERROR_CODE = {
    /**
     * Error when system error happens
     */
    SYSTEM_EXCEPTIONS: 1000,
    /**
     * Error when server basic error happens
     */
    GENERAL_EXCEPTIONS: 1001,
    /**
     * Error when server could not handle the operation
     */
    INVALID_OPERATION: 1002,
    /**
     * Error when server could not access indicated resource
     */
    NOT_FIND_ACCESS_404: 1003,
    /**
     * Error when operation is not supported
     */
    NOT_SUPPORT_OPERATION: 1004,

    /**
     * Error in data base
     */
    DATABASE_EXCEPTION: 2000,
};

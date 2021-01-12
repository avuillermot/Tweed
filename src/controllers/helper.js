export const manageError = function (req, res, exception, httpCode) {
    console.log(exception);
    if (exception.message != null && exception.message != undefined && exception.message != "") res.status(500).send(exception.message);
    else res.status(500).send(exception);
}
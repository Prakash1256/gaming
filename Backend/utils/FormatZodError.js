const formatError = (issues) => {

    let errors = {};

    issues.errors?.map((issue) => {
        errors[issue.path?.[0]] = issue.message
    })

    return errors;
}

module.exports = {
    formatError
};
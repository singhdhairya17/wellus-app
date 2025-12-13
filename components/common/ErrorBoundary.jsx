import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

class ErrorBoundaryClass extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (__DEV__) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
        // In production, you could log to an error reporting service
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        const { colors } = this.props;
        
        if (this.state.hasError) {
            return (
                <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
                    <LinearGradient
                        colors={colors.isDark
                            ? [colors.CARD, colors.SURFACE]
                            : ['#FFFFFF', '#F8F9FA']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.errorCard, {
                            borderWidth: colors.isDark ? 1 : 0,
                            borderColor: colors.BORDER,
                        }]}
                    >
                        <Text style={styles.emoji}>😔</Text>
                        <Text style={[styles.title, { color: colors.TEXT }]}>
                            Oops! Something went wrong
                        </Text>
                        <Text style={[styles.message, { color: colors.TEXT_SECONDARY }]}>
                            We're sorry, but something unexpected happened. Please try again.
                        </Text>
                        {__DEV__ && this.state.error && (
                            <View style={[styles.errorContainer, {
                                backgroundColor: colors.RED + '15',
                                borderColor: colors.RED + '30',
                            }]}>
                                <Text style={[styles.errorText, { color: colors.RED }]}>
                                    {this.state.error.toString()}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.button, {
                                backgroundColor: colors.PRIMARY,
                            }]}
                            onPress={this.handleReset}
                        >
                            <Text style={[styles.buttonText, { color: colors.WHITE }]}>
                                Try Again
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            );
        }

        return this.props.children;
    }
}

// Default colors for ErrorBoundary (used when theme is not available)
const defaultColors = {
    BACKGROUND: '#F5F5F5',
    CARD: '#FFFFFF',
    SURFACE: '#F8F9FA',
    TEXT: '#1A1A1A',
    TEXT_SECONDARY: '#666666',
    BORDER: '#E5E5E5',
    PRIMARY: '#3B82F6',
    RED: '#EF4444',
    WHITE: '#FFFFFF',
    isDark: false
};

// ErrorBoundary component - uses default colors since it's outside ThemeProvider
const ErrorBoundary = ({ children }) => {
    return <ErrorBoundaryClass colors={defaultColors}>{children}</ErrorBoundaryClass>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorCard: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        elevation: 8,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    errorContainer: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        width: '100%',
    },
    errorText: {
        fontSize: 12,
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    button: {
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 12,
        minWidth: 120,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
});

export default ErrorBoundary;


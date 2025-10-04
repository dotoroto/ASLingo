class DummyModel:
    def predict(self, X):
        return ["HELLO"] * len(X)
model = DummyModel()

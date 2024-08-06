const {describe, it, beforeEach} = require("node:test");
const assert = require("node:assert/strict");
const toml = require("../lib/amd/toml.js");

describe('merge multiline', function () {
    var mergeMultilines = function (lines) {
        var merged = [], acc = [], capture = false, merge = false;
        lines.forEach(function (line) {
            if (multilineArrayStart(line)) {
                capture = true;
            }

            if (multilineArrayEnd(line)) {
                merge = true;
            }

            if (capture) {
                acc.push(line);
            } else {
                merged.push(line);
            }

            if (merge) {
                capture = false; merge = false;
                merged.push(acc.join(''));
                acc = [];
            }
        });

        return merged;

        function multilineArrayStart(line) {
            return line.indexOf('[') > 0 && line.indexOf(']') < 0;
        }

        function multilineArrayEnd(line) {
            return line.indexOf(']') > 0;
        }
    };

    var result;

    describe('for arrays', function () {
        beforeEach(() => {
            result = mergeMultilines(['hosts=["a",','"b",','"c"]']);
        });

        it ('should merge', function () {
            assert.equal(result[0], 'hosts=["a","b","c"]');
        });
    });

});

describe('toml.js spec', function () {
    var result;

    describe('toml construction', function () {
        it ('should exist', function () {
            assert.ok(toml);
        });
    });

    describe('when parsing a comment', function () {
        beforeEach(function () {
            result = toml.parse('# comment');
        });

        it ('should be empty object', function () {
            assert.deepEqual(result, {});
        });
    });

    describe('when parsing a group', function () {
        beforeEach(function () {
            result = toml.parse('[group]');
        });

        it ('should create new group', function () {
            assert.ok(result.group);
        });

        describe('nested group', function () {
            beforeEach(function () {
                result = toml.parse('[group.sub]');
            });

            it('should create nested group', function () {
                assert.ok(result.group.sub);
            });
        });

        describe('multiple groups', function () {
            beforeEach(function () {
                result = toml.parse('[first]\n[second]');
            });

            it ('should create first group', function () {
                assert.ok(result.first);
            });

            it ('should create second group', function () {
                assert.ok(result.second);
            });
        });
    });

    describe('when parsing expression', function () {

        describe('for integer', function () {
            beforeEach(function () {
                result = toml.parse('foo=1');
            });

            it ('should create integer', function () {
                assert.equal(result.foo, 1);
            });
        });

        describe('for float', function () {
            beforeEach(function () {
                result = toml.parse('foo=1.23');
            });

            it ('should create float', function () {
                assert.equal(result.foo, 1.23);
            });
        });

        describe('for boolean', function () {
            beforeEach(function () {
                result = toml.parse('foo=true');
            });

            it ('should create boolean', function () {
                assert.equal(result.foo, true);
            });
        });

        describe('for strings', function () {
            beforeEach(function () {
                result = toml.parse('foo="true"');
            });

            it ('should create string', function () {
                assert.equal(result.foo, "true");
            });
        });

        describe('for dates', function () {
            beforeEach(function () {
                result = toml.parse('foo=2013-02-24T01:13:00Z');
            });

            it ('should create dates', function () {
                assert.deepEqual(result.foo, new Date('2013-02-24T01:13:00Z'));
            });
        });

        describe('for arrays', function () {
            describe('of ints', function () {
                beforeEach(function () {
                    result = toml.parse('foo=[1,2,3]');
                });

                it('should create array of ints', function () {
                    assert.deepEqual(result.foo, [1,2,3]);
                });
            });

            describe('of floats', function () {
                beforeEach(function () {
                    result = toml.parse('foo=[1.1,2.2,3.3]');
                });

                it('should create array of floats', function () {
                    assert.deepEqual(result.foo, [1.1,2.2,3.3]);
                });
            });

            describe('of strings', function () {
                beforeEach(function () {
                    result = toml.parse('foo=["one","two","three"]');
                });

                it('should create array of string', function () {
                    assert.deepEqual(result.foo, ["one","two","three"]);
                });
            });

            describe('of dates', function () {
                beforeEach(function () {
                    result = toml.parse('foo=[2013-02-24T01:13:00Z,2013-02-25T01:13:00Z]');
                });

                it('should create array of dates', function () {
                    assert.deepStrictEqual(result.foo, [new Date('2013-02-24T01:13:00Z'), new Date('2013-02-25T01:13:00Z')]);
                });
            });

            describe('of multiple types', function () {
                beforeEach(function () {
                    result = toml.parse('foo=["one",1,2.2]');
                });

                it('should create array of multiple types', function () {
                    assert.deepEqual(result.foo, ["one",1,2.2]);
                });
            });

            describe('nested arrays', function () {
                beforeEach(function () {
                    result = toml.parse('foo=[1,2,[1,2,3]]');
                });

                it('should create nested arrays', function () {
                    assert.deepEqual(result.foo, [1,2,[1,2,3]]);
                });

                describe('nested nested', function () {
                    beforeEach(function () {
                        result = toml.parse('foo=[1,2,[3,4],5,[6,7,[8,9]]]');
                    });

                    it('should create nested arrays', function () {
                        assert.deepEqual(result.foo, [1,2,[3,4],5,[6,7,[8,9]]]);
                    });
                });

                describe('with different types', function () {
                    beforeEach(function () {
                        result = toml.parse('foo=[[1,2],["a","b","c"]]');
                    });

                    it('should create nested arrays', function () {
                        assert.deepEqual(result.foo, [[1,2],["a","b","c"]]);
                    });
                });
            });
        });

        describe('when groups with expression', function () {
            describe('one group one expression', function () {
                beforeEach(function () {
                    result = toml.parse('[group]\nfoo=1');
                });

                it ('should parse group', function () {
                    assert.ok(result.group);
                });

                it ('should parse expression in group', function () {
                    assert.equal(result.group.foo, 1);
                });
            });

            describe('one group two expressions', function () {
                beforeEach(function () {
                    result = toml.parse('[group]\nfoo=1\nboo=2');
                });

                it ('should parse group', function () {
                    assert.ok(result.group);
                });

                it ('should parse expression in group', function () {
                    assert.equal(result.group.foo, 1);
                    assert.equal(result.group.boo, 2);
                });
            });

            describe('one group with global expression', function () {
                beforeEach(function () {
                    result = toml.parse('global=1\n[group]\nfoo=1\nboo=2');
                });

                it ('should parse group', function () {
                    assert.ok(result.group);
                });

                it ('should parse expression in group', function () {
                    assert.equal(result.global, 1);
                    assert.ok(!result.group.global);
                });
            });

            describe('one group with global expression after', function () {
                beforeEach(function () {
                    result = toml.parse('[group]\nfoo=1\nboo=2\n\nglobal=1');
                });

                it ('should parse group', function () {
                    assert.ok(result.group);
                });

                it ('should parse expression in group', function () {
                    assert.equal(result.global, 1);
                    assert.ok(!result.group.global);
                });
            });

            describe('one group with subgroups', function () {
                beforeEach(function () {
                    result = toml.parse('[group]\nfoo=1\nboo=2\n\n[group.sub]\nmoo=1\n');
                });

                it ('should parse group', function () {
                    assert.ok(result.group);
                });

                it ('should parse sub group', function () {
                    assert.ok(result.group.sub);
                });

                it ('should parse expression in sub group', function () {
                    assert.equal(result.group.sub.moo, 1);
                });
            });


        });

        describe('when spaces and comments', function () {
            describe('with comments', function () {
                beforeEach(function() {
                    result = toml.parse('# TOML begin\n[group]\n#TOML end');
                });

                it ('should be parsed', function () {
                    assert.ok(result.group);
                });

                describe('in the same line', function () {
                    beforeEach(function () {
                        result = toml.parse('[group] # comment');
                    });

                    it ('should be parsed', function () {
                        assert.ok(result.group);
                    });
                });

                describe('in the same line with array', function () {
                    beforeEach(function () {
                        result = toml.parse('[clients]\ndata = [ ["gamma", "delta"], [1, 2] ] # just an update to make sure parsers support it');
                    });

                    it ('should be parsed', function () {
                        assert.ok(result.clients.data);
                    });
                });

            });

            describe('with spaces', function () {
                describe('spaces before', function () {
                    describe('for group', function () {
                        beforeEach(function () {
                            result = toml.parse('   [group]');
                        });

                        it ('should skip spaces', function () {
                            assert.ok(result.group);
                        });
                    });

                    describe('for expression', function () {
                        beforeEach(function () {
                            result = toml.parse('   foo=1');
                        });

                        it ('should skip spaces', function () {
                            assert.ok(result.foo);
                        });
                    });
                });

                describe('spaces after', function () {
                    describe('for group', function () {
                        beforeEach(function () {
                            result = toml.parse('   [group]   ');
                        });

                        it ('should skip spaces', function () {
                            assert.ok(result.group);
                        });
                    });

                    describe('for expression', function () {
                        beforeEach(function () {
                            result = toml.parse('   foo=1   ');
                        });

                        it ('should skip spaces', function () {
                            assert.ok(result.foo);
                        });
                    });
                });

                describe('spaces in the middle', function () {
                    describe('for group', function () {
                        beforeEach(function () {
                            result = toml.parse('   [   group  ]   ');
                        });

                        it ('should skip spaces', function () {
                            assert.ok(result.group);
                        });
                    });

                    describe('for expression', function () {
                        beforeEach(function () {
                            result = toml.parse('   foo  =  1   ');
                        });

                        it ('should skip spaces', function () {
                            assert.ok(result.foo);
                        });

                        describe('for arrays', function () {
                            beforeEach(function () {
                                result = toml.parse('   foo  =  [1, 2,   4]   ');
                            });

                            it ('should skip spaces', function () {
                                assert.ok(result.foo);
                            });
                        });
                    });
                });
            });
        });

        describe('when multiline array definition', function () {
            beforeEach(function () {
                result = toml.parse('hosts=["alpha",\n"beta",\n"omega"\n]');
            });

            it ('should parse', function () {
                assert.deepEqual(result.hosts, ["alpha","beta","omega"]);
            });
        });

        describe('when overriding group name', function () {
            it ('should throw an error', function () {
                assert.throws(function () {
                    toml.parse('[group]\nkey=1\n\n[group.key]\nval=2\n');
                }, Error);
            });
        });
    });

    describe('dump', function () {

        it('should expose a function', function () {
            assert.equal(typeof toml.dump, 'function');
        });

        describe('when data is number', function () {

            it ('should work with integer', function () {
                assert.equal(toml.dump(42), '42');
            });

            it ('should work with float', function () {
                assert.equal(toml.dump(42.12), '42.12');
            });
        });

        it ('should work with boolean', function () {
            assert.equal(toml.dump(true), 'true');
        });

        it ('should work with date', function () {
            var value = new Date(Date.UTC(1979, 5, 27, 7, 32, 0));
            assert.equal(toml.dump(value), '1979-06-27T07:32:00.000Z');
        });

        it ('should work with array', function () {
            var value = [1,2,3];
            assert.equal(toml.dump(value), '[1, 2, 3]');
        });

        describe('when data is string', function () {
            beforeEach(function () {
               result = toml.dump("Hello,\t\"Toml\"\n");
            });

            it ('should escape', function () {
                assert.equal(result, "\"Hello,\\t\\\"Toml\\\"\\n\"");
            });
        });

        it ('should work with hash', function () {
            var value = {title: 'Toml', ports: [8080, 8081], info:{name: 'Jonh'}};
            assert.equal(toml.dump(value), "title = \"Toml\"\nports = [8080, 8081]\n\n[info]\nname = \"Jonh\"\n\n");
        });
    });
});
